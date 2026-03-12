
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle2, X, Info, HandHelping } from "lucide-react";

interface SafetyWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SafetyWarningModal({ isOpen, onConfirm, onCancel }: SafetyWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[340px] rounded-3xl border-yellow-400/20 z-[200] p-0 overflow-hidden shadow-2xl">
        <div className="bg-yellow-50 p-8 text-center border-b border-yellow-100">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-2 border-yellow-200">
            <ShieldAlert className="w-10 h-10 text-yellow-600 animate-bounce" />
          </div>
          <h2 className="text-xl font-headline font-black text-yellow-900 mb-2">Aviso de Segurança</h2>
          <div className="bg-white/80 p-4 rounded-2xl border border-yellow-200 shadow-inner">
            <p className="text-sm font-bold text-yellow-900 leading-snug">
              ⚠️ Por segurança informa um familiar ou amigo de confiança que vais receber ajuda.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3 items-start">
            <div className="mt-1 shrink-0 p-1.5 bg-secondary/50 rounded-lg"><Info className="w-4 h-4 text-primary" /></div>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              O Portugal Unido não se responsabiliza por encontros presenciais. A segurança da comunidade depende da cautela de cada membro.
            </p>
          </div>
          
          <div className="space-y-2 pt-2">
            <Button className="w-full bg-primary font-black rounded-2xl h-14 shadow-lg shadow-primary/20 uppercase tracking-widest text-xs" onClick={onConfirm}>
              <CheckCircle2 className="w-5 h-5 mr-2" /> Entendi, continuar
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground font-bold hover:bg-destructive/5 hover:text-destructive transition-all h-10" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" /> Cancelar Aceitação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
