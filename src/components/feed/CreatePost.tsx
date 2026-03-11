
"use client";

import * as React from 'react';
import { PostType } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Sparkles, MapPin } from "lucide-react";
import { smartPostContentSuggestion } from "@/ai/flows/smart-post-content-suggestion-flow";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        candidateCount: 0,
        commentCount: 0,
        status: 'aberto',
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, "posts"), postData);
      
      // Update points in Firestore
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
      <Card className="w-full max-w-sm mb-20 animate-in slide-in-from-bottom-8 duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Novo Post</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
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
              className="min-h-[100px] text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {userProfile?.zone}, {userProfile?.district}</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={getSuggestions} disabled={loading}>
              <button className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-accent" /> Sugerir ideias
              </button>
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => setTexto(s)}
                  className="text-left text-[10px] p-2 bg-secondary rounded-lg border border-transparent hover:border-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <Button className="w-full font-bold" disabled={!texto || loading} onClick={handleCreate}>
            {loading ? "A publicar..." : "Publicar Post"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
