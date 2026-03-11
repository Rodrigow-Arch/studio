"use client";

import * as React from 'react';
import { PostType, store, useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Sparkles, MapPin } from "lucide-react";
import { smartPostContentSuggestion } from "@/ai/flows/smart-post-content-suggestion-flow";

export default function CreatePost({ onClose }: { onClose: () => void }) {
  const { currentUser } = useStore();
  const [tipo, setTipo] = React.useState<PostType>('Ajuda');
  const [texto, setTexto] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  const handleCreate = () => {
    if (!texto || !currentUser) return;
    
    store.addPost({
      id: Math.random().toString(36).substr(2, 9),
      tipo,
      texto,
      autor: currentUser.name,
      username: currentUser.username,
      avatarLetra: currentUser.avatarLetra,
      avatarCor: currentUser.avatarCor,
      distrito: currentUser.distrito,
      zona: currentUser.zona,
      lat: currentUser.lat,
      lng: currentUser.lng,
      candidatosCount: 0,
      comentariosCount: 0,
      status: 'aberto',
      uid: currentUser.uid,
      ts: Date.now()
    });

    currentUser.points += 15;
    store.save();
    onClose();
  };

  const getSuggestions = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await smartPostContentSuggestion({
        postType: tipo,
        userLocation: `${currentUser.distrito}, ${currentUser.zona}`
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
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {currentUser?.zona}, {currentUser?.distrito}</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={getSuggestions} disabled={loading}>
              <Sparkles className="w-3 h-3 text-accent" /> Sugerir ideias
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

          <Button className="w-full font-bold" disabled={!texto} onClick={handleCreate}>Publicar Post</Button>
        </CardContent>
      </Card>
    </div>
  );
}