
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2, X } from "lucide-react";

interface SafetyWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SafetyWarningModal({ isOpen, onConfirm, onCancel }: SafetyWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[340px] rounded-3xl border-yellow-400/20 z-[200]">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-8 h-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-lg font-headline">Aviso de Segurança</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-balance">
            ⚠️ Por segurança informa um familiar ou amigo de confiança que vais receber ajuda.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            O Portugal Unido não se responsabiliza por encontros presenciais. Continua apenas se te sentires seguro.
          </p>
        </div>

        <DialogFooter className="flex flex-col gap-2">
          <Button className="w-full bg-primary font-bold rounded-2xl h-12" onClick={onConfirm}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Entendi, continuar
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
