"use client";

import * as React from 'react';
import { useStore, store } from '@/lib/store';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Settings, LogOut, Award, ThumbsUp, Heart, MessageCircle } from "lucide-react";
import RatingStats from './RatingStats';

export default function ProfilePage() {
  const { currentUser } = useStore();
  const [showSettings, setShowSettings] = React.useState(false);

  if (!currentUser) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-primary h-32 relative">
         <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="ghost" size="icon" className="bg-white/20 text-white hover:bg-white/40 rounded-full" onClick={() => setShowSettings(true)}>
              <Settings className="w-5 h-5" />
            </Button>
         </div>
      </div>

      <div className="px-6 -mt-12 space-y-6 pb-10">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="w-24 h-24 border-4 border-white shadow-lg" style={{ backgroundColor: currentUser.avatarCor }}>
            <AvatarFallback className="bg-transparent text-white text-4xl font-headline">{currentUser.avatarLetra}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="font-headline text-2xl text-primary">{currentUser.name}</h2>
            <p className="text-muted-foreground text-sm">{currentUser.username}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
            <MapPin className="w-3 h-3" /> {currentUser.zona}, {currentUser.distrito}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Ajudas', value: currentUser.ajudas, icon: ThumbsUp },
            { label: 'Posts', value: store.posts.filter(p => p.uid === currentUser.uid).length, icon: MessageCircle },
            { label: 'Pontos', value: currentUser.points, icon: Award },
          ].map((stat, i) => (
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
          <p className="text-sm text-muted-foreground bg-secondary/20 p-4 rounded-2xl italic">
            {currentUser.descricao || "Conta algo sobre ti à comunidade..."}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-headline text-lg">Avaliações</h3>
          <RatingStats />
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

        <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => store.logout()}>
          <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
        </Button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-white p-6 animate-in slide-in-from-right duration-300">
           <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl">Definições</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}><X className="w-6 h-6" /></Button>
           </div>
           {/* Simple Settings form could be added here */}
           <p className="text-center text-muted-foreground">Funcionalidade de edição em breve.</p>
        </div>
      )}
    </div>
  );
}

function X(props: any) {
  return <Plus className="rotate-45" {...props} />;
}

import { Plus } from 'lucide-react';