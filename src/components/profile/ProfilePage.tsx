"use client";

import * as React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Award, ThumbsUp, LogOut, MessageCircle, X } from "lucide-react";
import RatingStats from './RatingStats';
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function ProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const [showSettings, setShowSettings] = React.useState(false);
  const [postCount, setPostCount] = React.useState(0);

  const userDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: userProfile, isLoading } = useDoc(userDocRef);

  React.useEffect(() => {
    if (user) {
      const q = query(collection(db, "posts"), where("authorId", "==", user.uid));
      getDocs(q).then(snapshot => {
        setPostCount(snapshot.size);
      });
    }
  }, [db, user]);

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-primary h-32 relative">
         <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full" onClick={() => setShowSettings(true)}>
              <X className="w-5 h-5 rotate-45" />
            </Button>
         </div>
      </div>

      <div className="px-6 -mt-12 space-y-6 pb-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg" style={{ backgroundColor: userProfile.avatarColor }}>
            <AvatarFallback className="bg-transparent text-white text-4xl font-headline">{userProfile.avatarLetter}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="font-headline text-2xl text-primary">{userProfile.fullName}</h2>
            <p className="text-muted-foreground text-sm">{userProfile.username}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
            <MapPin className="w-3 h-3" /> {userProfile.zone}, {userProfile.district}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Ajudas', value: userProfile.helpsGiven, icon: ThumbsUp },
            { label: 'Posts', value: postCount, icon: MessageCircle },
            { label: 'Pontos', value: userProfile.points, icon: Award },
          ].map((stat) => (
            <Card key={stat.label} className="border-none bg-secondary/30 shadow-none">
              <CardContent className="p-3 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-primary">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg">Sobre mim</h3>
          <div className="text-sm text-muted-foreground bg-secondary/20 p-4 rounded-2xl italic">
            {userProfile.description || "Conta algo sobre ti à comunidade..."}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline text-lg">Avaliações</h3>
          <RatingStats profile={userProfile} />
        </div>

        <div className="pt-4 border-t space-y-4">
          <h3 className="font-headline text-lg">Badges</h3>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-1 opacity-20 grayscale">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[8px] uppercase">Bloqueado</span>
              </div>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
        </Button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-white p-6 animate-in slide-in-from-right duration-300">
           <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl">Definições</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}><X className="w-6 h-6" /></Button>
           </div>
           <p className="text-center text-muted-foreground">Funcionalidade de edição em breve.</p>
        </div>
      )}
    </div>
  );
}
