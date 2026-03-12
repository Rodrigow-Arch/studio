
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Flag, ShieldAlert, ShieldCheck } from "lucide-react";
import { useFirestore, useUser } from "@/firebase";
import { collection, setDoc, updateDoc, doc, increment } from "firebase/firestore";
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
  const [customReason, setCustomReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!user || !reportedUserId) return;
    
    const finalReason = reason === 'Outro' ? `Outro: ${customReason}` : reason;
    
    if (reason === 'Outro' && !customReason.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "Por favor, descreve o motivo." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar uma referência de documento para obter o ID antes de gravar
      const reportRef = doc(collection(db, 'denuncias'));
      
      await setDoc(reportRef, {
        id: reportRef.id,
        reportedUserId,
        reporterId: user.uid,
        reason: finalReason,
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
      setCustomReason('');
    } catch (e) {
      console.error("Erro ao enviar denúncia:", e);
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
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border-2 border-destructive/20 text-destructive">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h2 className="text-md font-headline font-black text-destructive leading-tight">Denunciar Utilizador</h2>
          <p className="text-[9px] text-muted-foreground mt-1 px-4 leading-tight">
            Esta denúncia é anónima e será analisada com total confidencialidade.
          </p>
        </div>

        <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center">Seleciona o Motivo</p>
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <label 
                key={r} 
                htmlFor={r}
                className={`flex items-center space-x-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${reason === r ? 'bg-destructive/5 border-destructive/20' : 'bg-secondary/20 border-transparent hover:border-muted-foreground/20'}`}
              >
                <RadioGroupItem value={r} id={r} className="text-destructive border-destructive h-3.5 w-3.5" />
                <span className={`text-[11px] font-bold ${reason === r ? 'text-destructive' : 'text-muted-foreground'}`}>{r}</span>
              </label>
            ))}
          </RadioGroup>

          {reason === 'Outro' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <Textarea 
                placeholder="Explica o que aconteceu (máx. 200 caract.)..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value.slice(0, 200))}
                className="text-xs rounded-xl min-h-[80px] border-destructive/20 focus:border-destructive"
              />
              <p className="text-[8px] text-right text-muted-foreground mt-1">{customReason.length}/200</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-muted/30 border-t flex gap-2">
          <Button variant="ghost" className="flex-1 rounded-2xl font-bold h-9 text-[10px]" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="destructive" 
            className="flex-1 rounded-2xl font-black h-9 shadow-lg shadow-destructive/20 uppercase tracking-widest text-[9px]" 
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
