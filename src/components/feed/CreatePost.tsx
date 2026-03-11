
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, MapPin } from "lucide-react";
import { smartPostContentSuggestion } from "@/ai/flows/smart-post-content-suggestion-flow";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type PostType = 'Ajuda' | 'SOS' | 'Partilha' | 'Evento';

export default function CreatePost({ onClose }: { onClose: () => void }) {
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
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, "posts"), postData);
      
      // Atribui pontos pela participação
      await updateDoc(doc(db, "users", user.uid), {
        points: increment(15)
      });

      toast({
        title: "Publicado!",
        description: "Ganhaste 15 pontos por participar na comunidade.",
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
        userLocation: `${userProfile.district}, ${userProfile.zone}`
      });
      setSuggestions(res.suggestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-sm mb-20 animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[85vh]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
          <CardTitle className="text-lg">Novo Post</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </CardHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <CardContent className="space-y-4 pb-6">
            <div className="flex gap-2">
              {(['Ajuda', 'SOS', 'Partilha', 'Evento'] as PostType[]).map(t => (
                <Button
                  key={t}
                  variant={tipo === t ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-[10px] px-0 h-8 font-bold"
                  onClick={() => setTipo(t)}
                >
                  {t}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">O que precisas ou tens para partilhar?</Label>
              <Textarea 
                placeholder="Escreve aqui..." 
                value={texto} 
                onChange={e => setTexto(e.target.value)}
                className="min-h-[120px] text-sm"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {userProfile?.zone}, {userProfile?.district}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] gap-1 px-2" 
                onClick={getSuggestions} 
                disabled={loading}
              >
                <Sparkles className="w-3 h-3 text-accent" /> Sugerir ideias
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-2 border-t">
                <p className="text-[10px] font-bold text-accent flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ideias da IA:
                </p>
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => setTexto(s)}
                    className="text-left text-[11px] p-2 bg-secondary/50 rounded-lg border border-transparent hover:border-primary/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Button className="w-full font-bold h-11" disabled={!texto || loading} onClick={handleCreate}>
                {loading ? "A publicar..." : "Publicar Post"}
              </Button>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
