
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, LogIn, Hash } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, increment, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from '@/lib/badge-logic';

export default function JoinGroup({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleJoin = async () => {
    if (!code || !user) return;
    setLoading(true);

    try {
      const upperCode = code.trim().toUpperCase();
      const q = query(collection(db, "groups"), where("inviteCode", "==", upperCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Código inválido",
          description: "Não encontrámos nenhum grupo com este código.",
        });
        setLoading(false);
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();

      if (groupData.memberIds?.includes(user.uid)) {
        toast({
          title: "Já és membro",
          description: "Já fazes parte deste grupo!",
        });
        onClose();
        return;
      }

      await updateDoc(doc(db, "groups", groupDoc.id), {
        memberIds: arrayUnion(user.uid)
      });
      
      await updateDoc(doc(db, "users", user.uid), {
        groupsJoined: increment(1)
      });

      // REGRA: Criar grupo que atinge 5 membros dá 25 pontos ao admin
      const updatedGroupSnap = await getDoc(doc(db, "groups", groupDoc.id));
      const updatedGroupData = updatedGroupSnap.data();
      if (updatedGroupData && updatedGroupData.memberIds.length === 5) {
        await updateDoc(doc(db, "users", updatedGroupData.adminId), {
          points: increment(25)
        });
        await addDoc(collection(db, 'users', updatedGroupData.adminId, 'notifications'), {
          userId: updatedGroupData.adminId,
          type: 'badge',
          message: `O teu grupo "${updatedGroupData.name}" atingiu 5 membros! Ganhaste +25 pts de gratidão.`,
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }

      await checkAndAwardBadges(db, user.uid);
      
      toast({
        title: "Bem-vindo ao grupo!",
        description: `Entraste em "${groupData.name}" com sucesso.`,
      });
      onClose();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar no grupo",
        description: "Ocorreu um problema técnico. Tenta novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <Card className="w-full max-w-sm animate-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Entrar num Grupo</CardTitle>
            <CardDescription className="text-xs">Insere o código de 6 caracteres para te juntares.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Código de Convite</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="EXEMPLO" 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="rounded-xl border-2 focus:border-primary pl-10 text-center font-mono tracking-widest text-lg uppercase"
                maxLength={6}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button className="w-full font-bold h-12 rounded-2xl shadow-lg shadow-primary/20 bg-accent hover:bg-accent/90" disabled={code.length < 6 || loading} onClick={handleJoin}>
              {loading ? "A processar..." : "Entrar no Grupo"} <LogIn className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
