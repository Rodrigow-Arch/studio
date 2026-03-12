
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { DISTRITOS_PORTUGAL } from "@/lib/geo";
import { MapPin, CheckCircle2, ArrowRight, Camera, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { generateBioDescription } from "@/ai/flows/bio-description-generation-flow";
import ImageCropper from '@/components/profile/ImageCropper';
import LegalModal from '@/components/legal/LegalModals';
import CookieBanner from '@/components/legal/CookieBanner';

export default function AuthFlow() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [mode, setMode] = React.useState<'login' | 'register'>('register');
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    name: '',
    username: '',
    dataNasc: '',
    distrito: '',
    zona: '',
    telefone: '',
    photoUrl: '',
    description: '',
    lat: 38.7223,
    lng: -9.1393,
    acceptTerms: false
  });

  const [loading, setLoading] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);
  const [error, setError] = React.useState('');
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = React.useState(false);
  
  const [legalModal, setLegalModal] = React.useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  });

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.email.includes('@')) return setError('Email inválido');
      if (formData.password.length < 6) return setError('Senha deve ter pelo menos 6 caracteres');
      if (!formData.acceptTerms) return setError('Tens de aceitar os Termos e Condições para continuar.');
    }
    if (step === 2) {
      if (!formData.name) return setError('Nome é obrigatório');
      if (!formData.username) return setError('Username é obrigatório');
    }
    if (step === 3) {
      const parts = formData.dataNasc.split('/');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (isNaN(d.getTime())) return setError('Data inválida');
        const age = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 18) return setError('Deves ter 18+ anos para te registares.');
      } else {
        return setError('Formato de data inválido (DD/MM/AAAA)');
      }
    }
    if (step === 4) {
      if (!formData.distrito) return setError('Distrito é obrigatório');
      if (!formData.zona) return setError('Zona/Bairro é obrigatório');
    }
    if (step === 5) {
      if (!formData.telefone || formData.telefone.replace(/\s/g, '').length < 9) {
        return setError('Número de telemóvel inválido');
      }
    }

    setStep(s => s + 1);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (err: any) {
      setError('Email ou palavra-passe incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const avatarCor = `hsl(${Math.random() * 360}, 70%, 40%)`;
      
      const userProfile = {
        id: user.uid,
        fullName: formData.name,
        username: formData.username.startsWith('@') ? formData.username : `@${formData.username}`,
        email: formData.email,
        birthDate: formData.dataNasc,
        district: formData.distrito,
        zone: formData.zona,
        latitude: formData.lat,
        longitude: formData.lng,
        phoneNumber: formData.telefone,
        photoUrl: formData.photoUrl,
        description: formData.description,
        isPhoneVerified: true, 
        points: 0, 
        helpsGiven: 0,
        sharesMade: 0,
        averageRating: 0,
        totalRatings: 0,
        avatarLetter: formData.name.charAt(0).toUpperCase(),
        avatarColor: avatarCor,
        joinedTimestamp: new Date().toISOString(),
        termsAcceptedAt: new Date().toISOString(),
        socialLinks: []
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      
      toast({
        title: "Bem-vindo!",
        description: "A tua conta foi criada com sucesso.",
      });
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setFormData(prev => ({ ...prev, photoUrl: croppedImage }));
    setImageToCrop(null);
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const res = await generateBioDescription({
        name: formData.name,
        district: formData.distrito,
        zone: formData.zona
      });
      if (res.suggestions && res.suggestions.length > 0) {
        setFormData(prev => ({ ...prev, description: res.suggestions[0] }));
        toast({
          title: "Bio sugerida!",
          description: "A IA criou uma biografia para ti.",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar a sugestão agora.",
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const useGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(d => ({ ...d, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        toast({ description: "Coordenadas GPS obtidas com sucesso." });
      }, () => {
        setError('Não foi possível obter a localização via GPS.');
      });
    }
  };

  const maskDate = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let res = '';
    if (digits.length > 0) res += digits.substring(0, 2);
    if (digits.length > 2) res += '/' + digits.substring(2, 4);
    if (digits.length > 4) res += '/' + digits.substring(4, 8);
    setFormData({ ...formData, dataNasc: res });
  };

  const maskPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let res = '';
    if (digits.length > 0) res += digits.substring(0, 3);
    if (digits.length > 3) res += ' ' + digits.substring(3, 6);
    if (digits.length > 6) res += ' ' + digits.substring(6, 9);
    setFormData({ ...formData, telefone: res });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background relative overflow-hidden">
      <div className="w-full max-sm space-y-8 z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-black/5 animate-in zoom-in duration-500">
            <div className="flex-[2] bg-[#055a36] flex items-center justify-center">
              <span className="text-4xl">🤝</span>
            </div>
            <div className="h-[3px] bg-[#fcd116]" />
            <div className="flex-1 bg-[#ce1126] flex items-center justify-center">
              <span className="text-white font-headline text-xl font-black tracking-widest">PU</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-headline text-4xl text-primary">Portugal Unido</h1>
            <p className="text-muted-foreground text-sm font-medium">A tua rede social comunitária.</p>
          </div>
        </div>

        {mode === 'login' ? (
          <Card className="animate-in fade-in slide-in-from-bottom-4 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>Bem-vindo de volta à tua comunidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="teu@email.pt" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Palavra-passe <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input 
                    type={showLoginPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all active:scale-90"
                  >
                    {showLoginPassword ? (
                      <EyeOff key="eye-off" className="w-4 h-4 animate-in fade-in zoom-in-75 duration-300" />
                    ) : (
                      <Eye key="eye-on" className="w-4 h-4 animate-in fade-in zoom-in-75 duration-300" />
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-destructive font-bold">{error}</p>}
              <Button className="w-full h-12 rounded-2xl font-bold text-md" onClick={handleLogin} disabled={loading}>
                {loading ? "A entrar..." : "Entrar"}
              </Button>
              <Button variant="link" className="w-full text-xs" onClick={() => setMode('register')}>Não tens conta? Cria uma agora</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-1">
              <Progress value={(step / 7) * 100} className="h-2 w-32" />
              <span className="text-xs text-muted-foreground font-black">{step}/7</span>
            </div>

            {error && <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 animate-in fade-in zoom-in-95 font-bold">{error}</div>}

            {step === 1 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl">
                <CardHeader><CardTitle>Passo 1: Credenciais</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email <span className="text-destructive">*</span></Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemplo@mail.pt" />
                  </div>
                  <div className="space-y-2">
                    <Label>Palavra-passe <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input 
                        type={showRegisterPassword ? "text" : "password"} 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        placeholder="Mínimo 6 caracteres" 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-all active:scale-90"
                      >
                        {showRegisterPassword ? (
                          <EyeOff key="reg-eye-off" className="w-4 h-4 animate-in fade-in zoom-in-75 duration-300" />
                        ) : (
                          <Eye key="reg-eye-on" className="w-4 h-4 animate-in fade-in zoom-in-75 duration-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 pt-2">
                    <Checkbox 
                      id="terms" 
                      checked={formData.acceptTerms} 
                      onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})} 
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-[11px] leading-tight text-muted-foreground font-medium">
                      Li e aceito os <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'terms' })} className="text-primary font-bold hover:underline">Termos e Condições</button> e a <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="text-primary font-bold hover:underline">Política de Privacidade</button>.
                    </Label>
                  </div>

                  <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleNext} disabled={!formData.acceptTerms}>
                    Continuar <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl">
                <CardHeader><CardTitle>Passo 2: Identidade</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo <span className="text-destructive">*</span></Label>
                    <Input value={formData.name} placeholder="O teu nome" onChange={e => {
                      const n = e.target.value;
                      const u = '@' + n.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      setFormData({...formData, name: n, username: u});
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome de Utilizador (Username) <span className="text-destructive">*</span></Label>
                    <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                  <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleNext}>
                    Continuar <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl">
                <CardHeader><CardTitle>Passo 3: Nascimento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data (DD/MM/AAAA) <span className="text-destructive">*</span></Label>
                    <Input value={formData.dataNasc} placeholder="Ex: 15/05/1995" onChange={e => maskDate(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground font-medium">Deves ter mais de 18 anos para participar.</p>
                  </div>
                  <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleNext}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl">
                <CardHeader><CardTitle>Passo 4: Localização</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Distrito <span className="text-destructive">*</span></Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary" value={formData.distrito} onChange={e => setFormData({...formData, distrito: e.target.value})}>
                      <option value="">Selecionar Distrito</option>
                      {DISTRITOS_PORTUGAL.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Zona / Bairro <span className="text-destructive">*</span></Label>
                    <Input value={formData.zona} placeholder="Ex: Baixa, Campanhã, etc." onChange={e => setFormData({...formData, zona: e.target.value})} />
                  </div>
                  <Button variant="outline" className="w-full text-xs h-9 rounded-xl" onClick={useGPS}>
                    <MapPin className="mr-2 w-3 h-3" /> Usar GPS para precisão
                  </Button>
                  <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleNext}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </CardContent>
              </Card>
            )}

            {step === 5 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle>Passo 5: Contacto</CardTitle>
                  <CardDescription>O teu número é essencial para verificações de segurança.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Telemóvel (+351) <span className="text-destructive">*</span></Label>
                    <Input value={formData.telefone} placeholder="912 345 678" onChange={e => maskPhone(e.target.value)} />
                  </div>
                  <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleNext}>
                    Continuar <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 6 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle>Passo 6: Foto de Perfil</CardTitle>
                  <CardDescription>Mostra à comunidade quem tu és. (Opcional)</CardDescription>
                </CardHeader>
                <CardContent className="space-6 flex flex-col items-center">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="w-28 h-28 border-4 border-primary/10 shadow-lg">
                      {formData.photoUrl && <AvatarImage src={formData.photoUrl} className="object-cover" />}
                      <AvatarFallback className="text-3xl font-bold bg-secondary">
                        {formData.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  
                  <div className="w-full space-y-2 pt-4">
                    <Button variant="outline" className="w-full rounded-xl text-xs h-9" onClick={() => fileInputRef.current?.click()}>
                      Selecionar Imagem
                    </Button>
                    <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleNext}>
                      {formData.photoUrl ? "Continuar" : "Saltar Passo"} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 7 && (
              <Card className="animate-in fade-in slide-in-from-right-4 shadow-xl rounded-3xl border-primary/20">
                <CardHeader>
                  <CardTitle>Passo 7: Sobre Ti</CardTitle>
                  <CardDescription>Uma breve descrição ajuda vizinhos a conhecerem-te melhor. (Opcional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Biografia</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] gap-1 px-2 text-primary hover:bg-primary/5" 
                        onClick={handleGenerateBio}
                        disabled={isGeneratingBio}
                      >
                        <Sparkles className={`w-3 h-3 ${isGeneratingBio ? 'animate-spin' : ''}`} /> Sugerir com IA
                      </Button>
                    </div>
                    <Textarea 
                      placeholder="Conta algo sobre ti... (ex: Gosto de bricolage, jardinagem, etc.)" 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="min-h-[120px] rounded-xl text-sm"
                    />
                  </div>
                  <Button className="w-full h-14 rounded-2xl font-black bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 uppercase tracking-widest text-xs" onClick={handleCreateAccount} disabled={loading}>
                    {loading ? "A criar conta..." : "Finalizar e Entrar"} <CheckCircle2 className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="text-center pt-2">
              <Button variant="link" className="text-xs text-muted-foreground" onClick={() => setMode('login')}>
                Já tens uma conta? Faz login
              </Button>
            </div>
          </div>
        )}
        
        {/* Rodapé Legal */}
        <footer className="pt-8 pb-12 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            <button onClick={() => setLegalModal({ isOpen: true, type: 'terms' })} className="hover:text-primary transition-colors">Termos e Condições</button>
            <span>•</span>
            <button onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="hover:text-primary transition-colors">Privacidade</button>
            <span>•</span>
            <a href="mailto:legal@portugalunido.pt" className="hover:text-primary transition-colors">Contacto</a>
          </div>
          <p className="text-[9px] text-muted-foreground/50 font-medium">© 2025 Portugal Unido • Feito com 🤝 em Portugal</p>
        </footer>
      </div>

      <ImageCropper 
        image={imageToCrop} 
        onCropComplete={handleCropComplete} 
        onCancel={() => setImageToCrop(null)} 
      />

      <LegalModal 
        isOpen={legalModal.isOpen} 
        type={legalModal.type} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
      />

      <CookieBanner />
    </div>
  );
}
