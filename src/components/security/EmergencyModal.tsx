
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
      <DialogContent className="max-w-[360px] rounded-3xl border-destructive/20 z-[200] overflow-hidden p-0">
        <DialogHeader className="hidden">
          <DialogTitle>SOS Emergência</DialogTitle>
          <DialogDescription>Contactos de emergência nacionais portugueses.</DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 p-6 text-center border-b border-destructive/10">
          <div className="w-16 h-16 bg-destructive text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-destructive font-headline text-2xl font-black">SOS Emergência</h2>
          <p className="text-xs text-destructive/80 font-medium mt-1">
            Utiliza estes números apenas em situações de perigo real.
          </p>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {EMERGENCY_NUMBERS.map((item) => (
            <a 
              key={item.name} 
              href={`tel:${item.number}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-destructive/5 hover:border-destructive/20 transition-all border border-transparent active:scale-95 group"
            >
              <div className="flex-1">
                <p className="text-sm font-black text-primary group-hover:text-destructive transition-colors">{item.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{item.description}</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-destructive group-hover:text-white transition-all">
                <Phone className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>

        <div className="p-4 bg-muted/30 border-t">
          <Button variant="ghost" className="w-full rounded-2xl font-bold h-12 hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
            Fechar Painel de Ajuda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
