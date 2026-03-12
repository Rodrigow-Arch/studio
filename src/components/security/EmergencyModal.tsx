
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle, ShieldAlert } from "lucide-react";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_NUMBERS = [
  { name: '112 Emergência Geral', number: '112', description: 'Número de emergência europeu' },
  { name: 'PSP (Lisboa)', number: '217654242', description: 'Polícia de Segurança Pública' },
  { name: 'GNR (Geral)', number: '217654242', description: 'Guarda Nacional Republicana' },
  { name: 'INEM', number: '112', description: 'Emergência Médica' },
  { name: 'SOS Voz Amiga', number: '213544545', description: 'Apoio emocional' },
];

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] rounded-3xl border-destructive/20 z-[200] overflow-hidden p-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>SOS Emergência</DialogTitle>
          <DialogDescription>Contactos de emergência nacionais portugueses.</DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 p-4 text-center border-b border-destructive/10 shrink-0">
          <div className="w-12 h-12 bg-destructive text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-destructive font-headline text-xl font-black">SOS Emergência</h2>
          <p className="text-[10px] text-destructive/80 font-bold mt-1 uppercase tracking-tight px-6">
            Utiliza estes números apenas em situações de perigo real.
          </p>
        </div>

        <div className="p-3 space-y-1.5 max-h-[50vh] overflow-y-auto scrollbar-hide">
          {EMERGENCY_NUMBERS.map((item) => (
            <a 
              key={item.name} 
              href={`tel:${item.number}`}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 hover:bg-destructive/5 hover:border-destructive/20 transition-all border border-transparent active:scale-95 group"
            >
              <div className="flex-1">
                <p className="text-sm font-black text-primary group-hover:text-destructive transition-colors">{item.name}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{item.description}</p>
              </div>
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-destructive group-hover:text-white transition-all shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
            </a>
          ))}
        </div>

        <div className="p-3 bg-muted/30 border-t">
          <Button variant="ghost" className="w-full rounded-2xl font-bold h-10 hover:bg-destructive/10 hover:text-destructive transition-colors text-xs" onClick={onClose}>
            Fechar Painel de Ajuda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
