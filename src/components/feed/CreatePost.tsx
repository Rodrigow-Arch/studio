
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, MapPin, Shield } from "lucide-react";
import { smartPostContentSuggestion } from "@/ai/flows/smart-post-content-suggestion-flow";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type PostType = 'Ajuda' | 'SOS' | 'Partilha' | 'Evento';

interface CreatePostProps {
  onClose: () => void;
  groupId?: string; // Optional: If provided, the post is private to this group
}

export default function CreatePost({ onClose, groupId }: CreatePostProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);
  
  const { data: userProfile } = useDoc(userDocRef);

  const [tipo, setTipo] = React.useState<PostType>('Ajuda');
  const [texto, setTexto] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  const handleCreate = async () => {
    if (!texto || !user || !userProfile) return;
    setLoading(true);

    try {
      const postData = {
        type: tipo,
        text: texto,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorAvatarLetter: userProfile.avatarLetter,
        authorAvatarColor: userProfile.avatarColor,
        district: userProfile.district,
        zone: userProfile.zone,
        latitude: userProfile.latitude || 0,
        longitude: userProfile.longitude || 0,
        candidateCount: 0,
        commentCount: 0,
        status: 'aberto',
        timestamp: new Date().toISOString(),
        groupId: groupId || null, // Se groupId existir, o post é privado do grupo
        isPublic: !groupId // Se não houver groupId, o post é público
      };

      await addDoc(collection(db, "posts"), postData);
      
      // Atribui pontos pela participação
      await updateDoc(doc(db, "users", user.uid), {
        points: increment(groupId ? 10 : 15) // Menos pontos para posts de grupo privados
      });

      toast({
        title: groupId ? "Tarefa criada!" : "Publicado!",
        description: `Ganhaste ${groupId ? 10 : 15} pontos por participar na comunidade.`,
      });
      onClose();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao publicar",
        description: "Não foi possível guardar o teu post."
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const res = await smartPostContentSuggestion({
        postType: tipo,
        userLocation: groupId ? "Tarefa de Grupo Privada" : `${userProfile.district}, ${userProfile.zone}`
      });
      setSuggestions(res.suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-sm mb-20 animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh] shadow-2xl border-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0 bg-primary/5 rounded-t-xl">
          <div className="flex items-center gap-2">
            {groupId && <Shield className="w-4 h-4 text-primary" />}
            <CardTitle className="text-lg">{groupId ? 'Nova Tarefa de Grupo' : 'Novo Post Público'}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8"><X className="w-4 h-4" /></Button>
        </CardHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <CardContent className="space-y-4 pb-6 pt-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {(['Ajuda', 'SOS', 'Partilha', 'Evento'] as PostType[]).map(t => (
                <Button
                  key={t}
                  variant={tipo === t ? 'default' : 'secondary'}
                  size="sm"
                  className={`flex-1 text-[9px] px-2 h-7 font-bold transition-all ${tipo === t ? 'shadow-md scale-105' : 'opacity-70'}`}
                  onClick={() => setTipo(t)}
                >
                  {t}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">O que precisas ou tens para partilhar?</Label>
              <Textarea 
                placeholder={groupId ? "Ex: Alguém tem uma cebola que possa dispensar?" : "Escreve aqui..."} 
                value={texto} 
                onChange={e => setTexto(e.target.value)}
                className="min-h-[100px] text-sm rounded-xl border-2 focus:border-primary transition-all resize-none"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground bg-secondary/40 px-2 py-1 rounded-full">
                <MapPin className="w-3 h-3" /> 
                {groupId ? 'Privado do Grupo' : `${userProfile?.zone}, ${userProfile?.district}`}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] gap-1 px-2 hover:text-primary hover:bg-primary/5 transition-colors" 
                onClick={getSuggestions} 
                disabled={loading}
              >
                <Sparkles className="w-3 h-3 text-accent" /> Sugerir ideias
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-3 border-t-2 border-dashed">
                <p className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-tighter">
                  <Sparkles className="w-3 h-3 text-accent" /> Ideias Inteligentes:
                </p>
                <div className="grid gap-1.5">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => setTexto(s)}
                      className="text-left text-[11px] p-2.5 bg-secondary/30 rounded-xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-sm transition-all animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button className="w-full font-black h-12 rounded-2xl shadow-lg shadow-primary/20 text-sm uppercase tracking-wide" disabled={!texto || loading} onClick={handleCreate}>
                {loading ? "A processar..." : (groupId ? "Criar Tarefa Privada" : "Publicar na Rede")}
              </Button>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
