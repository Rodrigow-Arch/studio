
"use client";

import * as React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Award, ThumbsUp, LogOut, MessageCircle, X, ArrowLeft, Save, Sparkles, Phone, User as UserIcon } from "lucide-react";
import RatingStats from './RatingStats';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { DISTRITOS_PORTUGAL } from '@/lib/geo';
import { generateBioDescription } from '@/ai/flows/bio-description-generation-flow';

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

  const targetUid = userId || currentUser?.uid;
  const isOwnProfile = targetUid === currentUser?.uid;

  const userDocRef = useMemoFirebase(() => {
    return targetUid ? doc(db, 'users', targetUid) : null;
  }, [db, targetUid]);

  const { data: userProfile, isLoading } = useDoc(userDocRef);

  // Form state
  const [editData, setEditData] = React.useState({
    fullName: '',
    description: '',
    district: '',
    zone: '',
    phoneNumber: '',
  });

  React.useEffect(() => {
    if (userProfile) {
      setEditData({
        fullName: userProfile.fullName || '',
        description: userProfile.description || '',
        district: userProfile.district || '',
        zone: userProfile.zone || '',
        phoneNumber: userProfile.phoneNumber || '',
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
      });
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
          description: "A IA criou uma nova biografia para ti. Podes editá-la se quiseres.",
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
            {isOwnProfile && (
              <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full active:scale-90 transition-all" onClick={() => setShowSettings(true)}>
                <Save className="w-5 h-5" />
              </Button>
            )}
         </div>
      </div>

      <div className="px-6 -mt-12 space-y-6 pb-24 relative z-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl hover:scale-105 transition-transform duration-300" style={{ backgroundColor: userProfile.avatarColor }}>
            <AvatarFallback className="bg-transparent text-white text-4xl font-headline">{userProfile.avatarLetter}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-500">
            <h2 className="font-headline text-2xl text-primary">{userProfile.fullName}</h2>
            <p className="text-muted-foreground text-sm font-medium">{userProfile.username}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-4 py-1.5 rounded-full shadow-sm animate-in zoom-in-95 duration-700">
            <MapPin className="w-3 h-3 text-primary" /> {userProfile.zone}, {userProfile.district}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {[
            { label: 'Ajudas', value: userProfile.helpsGiven, icon: ThumbsUp },
            { label: 'Posts', value: postCount, icon: MessageCircle },
            { label: 'Pontos', value: userProfile.points, icon: Award },
          ].map((stat, idx) => (
            <Card key={stat.label} className="border-none bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-primary">{stat.value}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-700">
          <h3 className="font-headline text-lg">Sobre {isOwnProfile ? 'mim' : userProfile.fullName.split(' ')[0]}</h3>
          <div className="text-sm text-muted-foreground bg-white p-5 rounded-3xl italic shadow-sm border border-secondary">
            {userProfile.description || (isOwnProfile ? "Conta algo sobre ti à comunidade..." : "Este utilizador ainda não adicionou uma descrição.")}
          </div>
        </div>

        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-700">
          <h3 className="font-headline text-lg">Avaliações</h3>
          <RatingStats profile={userProfile} />
        </div>

        <div className="pt-4 border-t space-y-4 animate-in fade-in duration-1000">
          <h3 className="font-headline text-lg">Badges</h3>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-1 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white shadow-inner">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[8px] uppercase font-bold">Bloqueado</span>
              </div>
            ))}
          </div>
        </div>

        {isOwnProfile && (
          <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 active:scale-95 transition-all rounded-2xl h-12 font-bold" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
          </Button>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
           <header className="p-4 border-b flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="active:scale-90" onClick={() => setShowSettings(false)}>
                  <X className="w-6 h-6" />
                </Button>
                <h2 className="font-headline text-xl">Definições de Perfil</h2>
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
             <div className="p-6 space-y-6 pb-24">
                <div className="space-y-4">
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

                <div className="pt-10 space-y-4">
                  <div className="p-4 bg-secondary/20 rounded-2xl border border-dashed text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Privacidade</p>
                    <p className="text-xs">O teu email e nome de utilizador não podem ser alterados para segurança da rede.</p>
                  </div>

                  <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 rounded-2xl h-12 font-bold" onClick={handleLogout}>
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
