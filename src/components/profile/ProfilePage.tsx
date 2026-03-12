
"use client";

import * as React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Award, ThumbsUp, LogOut, MessageCircle, X, ArrowLeft } from "lucide-react";
import RatingStats from './RatingStats';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface ProfilePageProps {
  userId?: string;
  onBack?: () => void;
}

export default function ProfilePage({ userId, onBack }: ProfilePageProps) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const [showSettings, setShowSettings] = React.useState(false);
  const [postCount, setPostCount] = React.useState(0);

  const targetUid = userId || currentUser?.uid;
  const isOwnProfile = targetUid === currentUser?.uid;

  const userDocRef = useMemoFirebase(() => {
    return targetUid ? doc(db, 'users', targetUid) : null;
  }, [db, targetUid]);

  const { data: userProfile, isLoading } = useDoc(userDocRef);

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
                <X className="w-5 h-5 rotate-45" />
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
        <div className="fixed inset-0 z-[100] bg-white p-6 animate-in slide-in-from-right duration-300">
           <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl">Definições</h2>
              <Button variant="ghost" size="icon" className="active:scale-90" onClick={() => setShowSettings(false)}><X className="w-6 h-6" /></Button>
           </div>
           <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className="p-6 bg-secondary/30 rounded-full animate-pulse">
                <X className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Funcionalidade de edição em breve.</p>
           </div>
        </div>
      )}
    </div>
  );
}
