
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, ShieldAlert, ShieldCheck } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, updateDoc, doc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  postId?: string;
}

const REPORT_REASONS = [
  "Comportamento suspeito",
  "Perfil falso",
  "Conteúdo inapropriado",
  "Esquema ou fraude",
  "Outro"
];

export default function ReportModal({ isOpen, onClose, reportedUserId, postId }: ReportModalProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [reason, setReason] = React.useState(REPORT_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!user || !reportedUserId) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'denuncias'), {
        reportedUserId,
        reporterId: user.uid,
        reason,
        postId: postId || null,
        timestamp: new Date().toISOString(),
        status: 'active'
      });

      await updateDoc(doc(db, 'users', reportedUserId), {
        reportCount: increment(1)
      });

      toast({
        title: "Denúncia enviada",
        description: "A nossa equipa irá analisar o caso brevemente. Obrigado por manteres a rede segura.",
      });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar denúncia" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[340px] rounded-3xl z-[200] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Denunciar Utilizador</DialogTitle>
          <DialogDescription>Formulário de denúncia para segurança da comunidade.</DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/5 p-4 text-center border-b">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border-2 border-destructive/20 text-destructive">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-headline font-black text-destructive">Denunciar Utilizador</h2>
          <p className="text-[10px] text-muted-foreground mt-1 px-4 leading-tight">
            Esta denúncia é anónima e será analisada com total confidencialidade.
          </p>
        </div>

        <div className="p-3 space-y-3">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Seleciona o Motivo</p>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <label 
                key={r} 
                htmlFor={r}
                className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer ${reason === r ? 'bg-destructive/5 border-destructive/20' : 'bg-secondary/20 border-transparent hover:border-muted-foreground/20'}`}
              >
                <RadioGroupItem value={r} id={r} className="text-destructive border-destructive" />
                <span className={`text-xs font-bold ${reason === r ? 'text-destructive' : 'text-muted-foreground'}`}>{r}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="p-3 bg-muted/30 border-t flex gap-2">
          <Button variant="ghost" className="flex-1 rounded-2xl font-bold h-10 text-xs" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="destructive" 
            className="flex-1 rounded-2xl font-black h-10 shadow-lg shadow-destructive/20 uppercase tracking-widest text-[10px]" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "A enviar..." : "Enviar Denúncia"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
