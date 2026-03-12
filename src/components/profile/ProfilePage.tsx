
"use client";

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Award, ThumbsUp, LogOut, MessageCircle, X, ArrowLeft, Save, Sparkles, Phone, User as UserIcon, Mail, AtSign, Lock, Camera, Flag, ShieldCheck } from "lucide-react";
import RatingStats from './RatingStats';
import BadgeGrid from './BadgeGrid';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { DISTRITOS_PORTUGAL, calculateDistance } from '@/lib/geo';
import { generateBioDescription } from '@/ai/flows/bio-description-generation-flow';
import { checkAndAwardBadges } from '@/lib/badge-logic';
import { getTrustLevel } from '@/lib/trust-levels';
import ReportModal from '../security/ReportModal';
import { differenceInDays } from 'date-fns';

interface ProfilePageProps {
  userId?: string;
  onBack?: () => void;
}

export default function ProfilePage({ userId, onBack }: ProfilePageProps) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [showSettings, setShowSettings] = React.useState(false);
  const [postCount, setPostCount] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const targetUid = userId || currentUser?.uid;
  const isOwnProfile = targetUid === currentUser?.uid;

  const userDocRef = useMemoFirebase(() => {
    return targetUid ? doc(db, 'users', targetUid) : null;
  }, [db, targetUid]);

  const { data: userProfile, isLoading } = useDoc(userDocRef);

  const [editData, setEditData] = React.useState({
    fullName: '',
    description: '',
    district: '',
    zone: '',
    phoneNumber: '',
    photoUrl: ''
  });

  React.useEffect(() => {
    if (userProfile) {
      setEditData({
        fullName: userProfile.fullName || '',
        description: userProfile.description || '',
        district: userProfile.district || '',
        zone: userProfile.zone || '',
        phoneNumber: userProfile.phoneNumber || '',
        photoUrl: userProfile.photoUrl || ''
      });
    }
  }, [userProfile]);

  React.useEffect(() => {
    if (targetUid) {
      const q = query(collection(db, "posts"), where("authorId", "==", targetUid));
      getDocs(q).then(snapshot => {
        setPostCount(snapshot.size);
      });
    }
  }, [db, targetUid]);

  if (isLoading || !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-xs text-muted-foreground">A carregar perfil...</p>
      </div>
    );
  }

  const handleLogout = () => {
    signOut(auth);
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: editData.fullName,
        description: editData.description,
        district: editData.district,
        zone: editData.zone,
        phoneNumber: editData.phoneNumber,
        photoUrl: editData.photoUrl
      });
      
      await checkAndAwardBadges(db, currentUser.uid);

      toast({
        title: "Definições guardadas!",
        description: "O teu perfil foi atualizado com sucesso.",
      });
      setShowSettings(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: "Não foi possível atualizar o teu perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { 
        toast({
          variant: "destructive",
          title: "Imagem muito grande",
          description: "Por favor, escolhe uma imagem com menos de 800KB."
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const res = await generateBioDescription({
        name: editData.fullName,
        district: editData.district,
        zone: editData.zone
      });
      if (res.suggestions && res.suggestions.length > 0) {
        setEditData(prev => ({ ...prev, description: res.suggestions[0] }));
        toast({
          title: "Bio sugerida!",
          description: "A IA criou uma nova biografia para ti.",
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

  const trustLevel = getTrustLevel(userProfile.points || 0);
  
  // SOS Verification Badge
  const accountAge = differenceInDays(new Date(), new Date(userProfile.joinedTimestamp));
  const isSOSVerified = accountAge >= 30 && userProfile.points >= 50 && userProfile.helpsGiven >= 2 && (userProfile.reportCount || 0) === 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full bg-background">
      <div className="bg-primary h-32 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
         <div className="absolute top-4 left-4 flex gap-2 z-10">
            {onBack && (
              <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
         </div>
         <div className="absolute top-4 right-4 flex gap-2 z-10">
            {!isOwnProfile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all"
                onClick={() => setIsReportOpen(true)}
              >
                <Flag className="w-5 h-5" />
              </Button>
            )}
            {isOwnProfile && (
              <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all" onClick={() => setShowSettings(true)}>
                <Save className="w-5 h-5" />
              </Button>
            )}
         </div>
      </div>

      <div className="px-6 -mt-12 space-y-6 pb-24 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl hover:scale-105 transition-transform duration-300">
            {userProfile.photoUrl && <AvatarImage src={userProfile.photoUrl} className="object-cover" />}
            <AvatarFallback className="text-white text-4xl font-headline" style={{ backgroundColor: userProfile.avatarColor }}>
              {userProfile.avatarLetter}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-headline text-2xl text-primary">{userProfile.fullName}</h2>
              {trustLevel && (
                <span title={trustLevel.label} className="text-2xl">{trustLevel.icon}</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium">{userProfile.username}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {trustLevel && (
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${trustLevel.bg} ${trustLevel.color} text-[10px] font-black uppercase tracking-wider border border-current/20`}>
                  <Award className="w-3 h-3" /> {trustLevel.label}
                </div>
              )}
              {isSOSVerified && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                  <ShieldCheck className="w-3 h-3" /> SOS Verificado 🛡️
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-4 py-1.5 rounded-full shadow-sm">
            <MapPin className="w-3 h-3 text-primary" /> {userProfile.zone}, {userProfile.district}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Ajudas', value: userProfile.helpsGiven, icon: ThumbsUp },
            { label: 'Posts', value: postCount, icon: MessageCircle },
            { label: 'Pontos', value: userProfile.points, icon: Award },
          ].map((stat) => (
            <Card key={stat.label} className="border-none bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-primary">{stat.value}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg">Sobre {isOwnProfile ? 'mim' : userProfile.fullName.split(' ')[0]}</h3>
          <div className="text-sm text-muted-foreground bg-white p-5 rounded-3xl italic shadow-sm border border-secondary">
            {userProfile.description || (isOwnProfile ? "Conta algo sobre ti à comunidade..." : "Este utilizador ainda não adicionou uma descrição.")}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline text-lg">Avaliações</h3>
          <RatingStats profile={userProfile} />
        </div>

        <div className="pt-4 border-t space-y-4">
          <BadgeGrid earnedBadgeIds={userProfile.earnedBadges || []} />
        </div>

        {isOwnProfile && (
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/20 hover:bg-primary hover:text-white active:bg-accent active:scale-95 transition-all rounded-2xl h-12 font-bold" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
          </Button>
        )}
      </div>

      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportedUserId={targetUid}
      />

      {showSettings && (
        <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
           <header className="p-4 border-b flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="active:scale-90" onClick={() => setShowSettings(false)}>
                  <X className="w-6 h-6" />
                </Button>
                <h2 className="font-headline text-xl">Definições</h2>
              </div>
              <Button 
                size="sm" 
                className="rounded-full bg-primary text-white font-bold h-9 px-4" 
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1.5" /> {isSaving ? "A guardar..." : "Guardar"}
              </Button>
           </header>

           <ScrollArea className="flex-1">
             <div className="p-6 space-y-8 pb-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="w-24 h-24 border-2 border-primary/20">
                      {editData.photoUrl && <AvatarImage src={editData.photoUrl} className="object-cover" />}
                      <AvatarFallback className="text-2xl font-bold" style={{ backgroundColor: userProfile.avatarColor }}>
                        {userProfile.avatarLetter}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white w-6 h-6" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <p className="text-[10px] text-muted-foreground uppercase font-black">Alterar Foto de Perfil</p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase text-primary tracking-widest border-b pb-2">Informação Pessoal</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <UserIcon className="w-3 h-3" /> Nome Completo
                    </Label>
                    <Input 
                      value={editData.fullName} 
                      onChange={e => setEditData({...editData, fullName: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Biografia</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 text-primary"
                        onClick={handleGenerateBio}
                        disabled={isGeneratingBio}
                      >
                        <Sparkles className={`w-3 h-3 ${isGeneratingBio ? 'animate-spin' : ''}`} /> 
                        {isGeneratingBio ? 'A gerar...' : 'Sugerir com IA'}
                      </Button>
                    </div>
                    <Textarea 
                      value={editData.description} 
                      onChange={e => setEditData({...editData, description: e.target.value})}
                      placeholder="Conta algo sobre ti..."
                      className="min-h-[100px] rounded-xl resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Distrito</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                        value={editData.district} 
                        onChange={e => setEditData({...editData, district: e.target.value})}
                      >
                        {DISTRITOS_PORTUGAL.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase text-muted-foreground">Zona/Bairro</Label>
                      <Input 
                        value={editData.zone} 
                        onChange={e => setEditData({...editData, zone: e.target.value})}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Telemóvel (+351)
                    </Label>
                    <Input 
                      value={editData.phoneNumber} 
                      onChange={e => setEditData({...editData, phoneNumber: e.target.value})}
                      placeholder="912 345 678"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="text-xs font-black uppercase text-destructive tracking-widest border-b pb-2 flex items-center justify-between">
                    Segurança e Privacidade <Lock className="w-3 h-3" />
                  </h3>
                  
                  <div className="space-y-2 opacity-70">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email de Registo
                    </Label>
                    <div className="relative">
                      <Input value={userProfile.email} disabled className="rounded-xl bg-secondary/30 cursor-not-allowed pr-10" />
                      <Lock className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-70">
                    <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                      <AtSign className="w-3 h-3" /> Nome de Utilizador
                    </Label>
                    <div className="relative">
                      <Input value={userProfile.username} disabled className="rounded-xl bg-secondary/30 cursor-not-allowed pr-10 font-medium" />
                      <Lock className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 pb-12">
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive border-destructive/20 hover:bg-primary hover:text-white active:bg-accent rounded-2xl h-12 font-bold" 
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Terminar Sessão
                  </Button>
                </div>
             </div>
           </ScrollArea>
        </div>
      )}
    </div>
  );
}
