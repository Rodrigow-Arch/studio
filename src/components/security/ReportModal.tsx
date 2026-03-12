
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, ShieldAlert } from "lucide-react";
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
      <DialogContent className="max-w-[340px] rounded-3xl z-[200]">
        <DialogHeader>
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-center text-lg font-headline">Denunciar Utilizador</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Esta denúncia é anónima e será analisada pela nossa equipa de moderação.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {REPORT_REASONS.map((r) => (
              <div key={r} className="flex items-center space-x-3 p-3 rounded-2xl border bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="flex-1 cursor-pointer text-xs font-bold">{r}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="ghost" className="flex-1 rounded-xl" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="destructive" 
            className="flex-1 rounded-xl font-bold" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "A enviar..." : "Denunciar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
