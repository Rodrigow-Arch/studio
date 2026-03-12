
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Sparkles, MapPin, Shield, Euro, AlertTriangle, Zap } from "lucide-react";
import { smartPostContentSuggestion } from "@/ai/flows/smart-post-content-suggestion-flow";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { checkAndAwardBadges } from '@/lib/badge-logic';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type PostType = 'Ajuda' | 'SOS' | 'Partilha' | 'Evento';

interface CreatePostProps {
  onClose: () => void;
  groupId?: string; 
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
  
  const [recompensa, setRecompensa] = React.useState<string>('');
  const [metodoPagamento, setMetodoPagamento] = React.useState<string>('Dinheiro');
  const [showSOSWarning, setShowSOSWarning] = React.useState(false);

  const handleCreate = async () => {
    if (!texto || !user || !userProfile) return;
    
    if (tipo === 'SOS' && !showSOSWarning) {
      setShowSOSWarning(true);
      return;
    }

    const valorNum = parseFloat(recompensa);
    if (!groupId && !isNaN(valorNum) && valorNum > 0 && !metodoPagamento) {
      toast({ variant: "destructive", title: "Erro", description: "Seleciona um método de pagamento." });
      return;
    }

    setLoading(true);

    try {
      const postData = {
        type: tipo,
        text: texto,
        authorId: user.uid,
        authorUsername: userProfile.username,
        authorAvatarLetter: userProfile.avatarLetter,
        authorAvatarColor: userProfile.avatarColor,
        authorPoints: userProfile.points || 0,
        district: userProfile.district,
        zone: userProfile.zone,
        latitude: userProfile.latitude || 0,
        longitude: userProfile.longitude || 0,
        candidateCount: 0,
        commentCount: 0,
        status: 'aberto',
        timestamp: new Date().toISOString(),
        groupId: groupId || null, 
        isPublic: !groupId,
        paymentAmount: !groupId && !isNaN(valorNum) ? valorNum : 0,
        paymentMethod: !groupId && !isNaN(valorNum) && valorNum > 0 ? metodoPagamento : null
      };

      await addDoc(collection(db, "posts"), postData);
      
      const updateData: any = {
        postsCreated: increment(1)
      };

      if (tipo === 'Partilha' && (!valorNum || valorNum === 0)) {
        updateData.sharesMade = increment(1);
      }
      
      if (tipo === 'Evento') {
        updateData.eventsCreated = increment(1);
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      await checkAndAwardBadges(db, user.uid);

      toast({
        title: groupId ? "Tarefa criada!" : "Publicado!",
        description: `A tua publicação foi partilhada com a comunidade.`,
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
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-sm animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] shadow-2xl border-primary/10 bg-white">
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
              <芽TextArea 
                placeholder={tipo === 'SOS' ? "Descreve a tua urgência com clareza..." : "Escreve aqui..."} 
                value={texto} 
                onChange={e => setTexto(e.target.value)}
                className="min-h-[120px] text-sm rounded-xl border-2 focus:border-primary transition-all resize-none"
                disabled={loading}
              />
            </div>

            {tipo !== 'SOS' && !groupId && (
              <div className="space-y-3 p-3 bg-secondary/10 rounded-2xl border border-dashed border-primary/20">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-1.5">
                    <Euro className="w-3 h-3" /> Recompensa Opcional (€)
                  </Label>
                  <span className="text-[9px] text-muted-foreground italic">Não é obrigatório</span>
                </div>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={recompensa}
                  onChange={e => setRecompensa(e.target.value)}
                  className="h-9 text-sm rounded-xl bg-white"
                />
                
                {parseFloat(recompensa) > 0 && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Método de Pagamento (Obrigatório)</Label>
                    <RadioGroup value={metodoPagamento} onValueChange={setMetodoPagamento} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Dinheiro" id="dinheiro" />
                        <Label htmlFor="dinheiro" className="text-xs">Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MB WAY" id="mbway" />
                        <Label htmlFor="mbway" className="text-xs">MB WAY</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

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
              <Button 
                className={`w-full font-black h-12 rounded-2xl shadow-lg text-sm uppercase tracking-wide transition-all ${
                  tipo === 'SOS' ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' : 'bg-primary shadow-primary/20'
                }`} 
                disabled={!texto || loading} 
                onClick={handleCreate}
              >
                {loading ? "A processar..." : (tipo === 'SOS' ? "Publicar SOS" : (groupId ? "Criar Tarefa Privada" : "Publicar na Rede"))}
              </Button>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>

      <Dialog open={showSOSWarning} onOpenChange={setShowSOSWarning}>
        <DialogContent className="max-w-[340px] rounded-3xl z-[200]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Aviso de Segurança SOS
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              ⚠️ Ao publicar um SOS estás a pedir ajuda presencial ou urgente a membros da comunidade. 
              <br/><br/>
              Por segurança apenas membros verificados e experientes podem responder. Mesmo assim informa sempre um familiar ou amigo de confiança. O Portugal Unido não se responsabiliza por encontros presenciais.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2">
            <Button className="w-full bg-destructive font-bold rounded-xl" onClick={handleCreate}>
              Entendi, publicar SOS
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowSOSWarning(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
