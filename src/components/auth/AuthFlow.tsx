"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DISTRITOS_PORTUGAL } from "@/lib/geo";
import { store, User } from "@/lib/store";
import { MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { generatePersonalizedUsernameSuggestion } from "@/ai/flows/personalized-username-suggestion";

export default function AuthFlow() {
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
    lat: 38.7223, // Default Lisbon
    lng: -9.1393
  });

  const [usernameAlternatives, setUsernameAlternatives] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.email.includes('@')) return setError('Email inválido');
      if (formData.password.length < 6) return setError('Senha deve ter 6+ caracteres');
    }
    if (step === 2) {
      if (!formData.name) return setError('Nome obrigatório');
      // Check username uniqueness
      const existing = store.users.find(u => u.username === formData.username);
      if (existing) {
        setError(`Este ${formData.username} já está em uso.`);
        // Call AI for alternatives
        const suggestions = await generatePersonalizedUsernameSuggestion({ fullName: formData.name });
        setUsernameAlternatives(suggestions.alternativeUsernames);
        return;
      }
    }
    if (step === 3) {
      // Date validation 18+
      const parts = formData.dataNasc.split('/');
      if (parts.length === 3) {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const age = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (age < 18) return setError('Deves ter 18+ anos para te registares.');
      } else {
        return setError('Data inválida');
      }
    }
    if (step === 4) {
      if (!formData.distrito || !formData.zona) return setError('Localização obrigatória');
    }

    setError('');
    setStep(s => s + 1);
  };

  const handleCreateAccount = () => {
    const avatarCor = `hsl(${Math.random() * 360}, 70%, 40%)`;
    const newUser: User = {
      uid: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      username: formData.username.startsWith('@') ? formData.username : `@${formData.username}`,
      email: formData.email,
      dataNasc: formData.dataNasc,
      distrito: formData.distrito,
      zona: formData.zona,
      lat: formData.lat,
      lng: formData.lng,
      telefone: formData.telefone,
      points: 0,
      ajudas: 0,
      partilhas: 0,
      avaliacaoMedia: 0,
      totalAvaliacoes: 0,
      descricao: '',
      avatarLetra: formData.name.charAt(0).toUpperCase(),
      avatarCor,
      joined: Date.now()
    };
    store.users.push(newUser);
    store.login(newUser);
  };

  const useGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(d => ({ ...d, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setError('GPS activo: Latitude/Longitude actualizadas.');
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

  if (mode === 'login') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-headline text-4xl text-primary">Portugal Unido</h1>
            <p className="text-muted-foreground">Bem-vindo de volta à tua comunidade.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="teu@email.pt" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Palavra-passe</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <Button className="w-full" onClick={() => {
                const user = store.users.find(u => u.email === formData.email && u.password === formData.password);
                if (user) store.login(user); else setError('Credenciais inválidas');
              }}>Entrar</Button>
              <Button variant="link" className="w-full text-xs" onClick={() => setMode('register')}>Não tens conta? Regista-te</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-6 bg-background">
      <div className="w-full max-w-sm mx-auto space-y-8 py-10">
        <div className="space-y-2 text-center">
          <h1 className="font-headline text-3xl text-primary">Cria a tua conta</h1>
          <div className="flex items-center justify-center gap-1">
            <Progress value={(step / 5) * 100} className="h-2 w-32" />
            <span className="text-xs text-muted-foreground">{step}/5</span>
          </div>
        </div>

        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

        {step === 1 && (
          <Card className="animate-in fade-in slide-in-from-right-4">
            <CardHeader><CardTitle>Credenciais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemplo@mail.pt" />
              </div>
              <div className="space-y-2">
                <Label>Palavra-passe</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${formData.password.length > 8 ? 'bg-accent w-full' : formData.password.length > 5 ? 'bg-yellow-400 w-2/3' : 'bg-destructive w-1/3'}`} />
                </div>
              </div>
              <Button className="w-full" onClick={handleNext}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-in fade-in slide-in-from-right-4">
            <CardHeader><CardTitle>Identidade</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={formData.name} onChange={e => {
                  const n = e.target.value;
                  const u = '@' + n.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  setFormData({...formData, name: n, username: u});
                }} />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              {usernameAlternatives.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sugestões:</p>
                  <div className="flex flex-wrap gap-2">
                    {usernameAlternatives.map(alt => (
                      <button key={alt} onClick={() => setFormData({...formData, username: alt})} className="text-xs px-2 py-1 bg-secondary rounded-full hover:bg-primary hover:text-white transition-colors">
                        {alt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={handleNext}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="animate-in fade-in slide-in-from-right-4">
            <CardHeader><CardTitle>Data de Nascimento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data (DD/MM/AAAA)</Label>
                <Input value={formData.dataNasc} placeholder="01/01/1990" onChange={e => maskDate(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleNext}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="animate-in fade-in slide-in-from-right-4">
            <CardHeader><CardTitle>Localização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Distrito</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.distrito} onChange={e => setFormData({...formData, distrito: e.target.value})}>
                  <option value="">Selecionar Distrito</option>
                  {DISTRITOS_PORTUGAL.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Zona / Bairro</Label>
                <Input value={formData.zona} placeholder="ex: Cedofeita" onChange={e => setFormData({...formData, zona: e.target.value})} />
              </div>
              <Button variant="outline" className="w-full" onClick={useGPS}>
                <MapPin className="mr-2 w-4 h-4" /> Usar GPS automaticamente
              </Button>
              <Button className="w-full" onClick={handleNext}>Continuar <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card className="animate-in fade-in slide-in-from-right-4">
            <CardHeader><CardTitle>Telefone (Opcional)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Número (+351)</Label>
                <Input value={formData.telefone} placeholder="912 345 678" onChange={e => maskPhone(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleCreateAccount}><CheckCircle2 className="mr-2 w-4 h-4" /> Criar Conta ✓</Button>
              <Button variant="link" className="w-full text-xs" onClick={handleCreateAccount}>Pular esta etapa</Button>
            </CardContent>
          </Card>
        )}

        {step < 5 && (
           <Button variant="link" className="w-full text-xs" onClick={() => setMode('login')}>Já tens conta? Entra aqui</Button>
        )}
      </div>
    </div>
  );
}