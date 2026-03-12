
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle } from "lucide-react";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_NUMBERS = [
  { name: '112 Emergência Geral', number: '112', description: 'Número de emergência europeu' },
  { name: 'PSP (Lisboa)', number: '+351217654242', description: 'Polícia de Segurança Pública' },
  { name: 'GNR (Geral)', number: '+351217654242', description: 'Guarda Nacional Republicana' },
  { name: 'INEM', number: '112', description: 'Emergência Médica' },
  { name: 'SOS Voz Amiga', number: '+351213544545', description: 'Apoio emocional' },
];

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] rounded-3xl border-destructive/20 z-[200]">
        <DialogHeader className="text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-destructive font-headline text-xl">SOS Emergência</DialogTitle>
          <DialogDescription className="text-xs">
            Utiliza estes números apenas em situações de perigo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {EMERGENCY_NUMBERS.map((item) => (
            <a 
              key={item.name} 
              href={`tel:${item.number}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent active:scale-95"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-primary">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.description}</p>
              </div>
              <Phone className="w-4 h-4 text-destructive" />
            </a>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full rounded-xl" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
