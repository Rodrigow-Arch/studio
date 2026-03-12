"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Shield, Users, BookOpen, Check } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from '@/lib/badge-logic';

export default function CreateGroup({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('Vizinhos');
  const [loading, setLoading] = React.useState(false);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!name || !user) return;
    setLoading(true);

    try {
      const inviteCode = generateInviteCode();
      const groupData = {
        name,
        type,
        inviteCode,
        adminId: user.uid,
        memberIds: [user.uid],
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, "groups"), groupData);
      
      await updateDoc(doc(db, "users", user.uid), {
        groupsAdmin: increment(1)
      });

      // Verificar badges após criar grupo
      await checkAndAwardBadges(db, user.uid);
      
      toast({
        title: "Grupo criado!",
        description: `Código de convite: ${inviteCode}`,
      });
      onClose();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao criar grupo",
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
            <CardTitle>Novo Grupo</CardTitle>
            <CardDescription className="text-xs">Cria um espaço privado para a tua comunidade.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-5 h-5" /></Button>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Grupo</Label>
            <Input 
              placeholder="Ex: Prédio 42, Família Silva..." 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="rounded-xl border-2 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Grupo</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Vizinhos', icon: Shield },
                { id: 'Família', icon: Users },
                { id: 'Outros', icon: BookOpen },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    type === t.id 
                    ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                    : 'border-secondary hover:border-primary/30 text-muted-foreground'
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{t.id}</span>
                  {type === t.id && <Check className="w-3 h-3 absolute top-2 right-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full font-bold h-12 rounded-2xl shadow-lg shadow-primary/20" disabled={!name || loading} onClick={handleCreate}>
              {loading ? "A criar..." : "Confirmar e Criar Grupo"}
            </Button>
            <p className="text-[10px] text-center mt-4 text-muted-foreground">
              Serás o administrador deste grupo e poderás convidar outros membros com um código.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
