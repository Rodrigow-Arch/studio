
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, XCircle, Lock } from "lucide-react";
import { differenceInDays } from "date-fns";

interface SOSRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
}

export default function SOSRequirementModal({ isOpen, onClose, userProfile }: SOSRequirementModalProps) {
  const accountAge = differenceInDays(new Date(), new Date(userProfile.joinedTimestamp));
  const requiredPoints = 500;
  const currentPoints = userProfile.points || 0;
  const hasPoints = currentPoints >= requiredPoints;

  const requirements = [
    { 
      label: "Conta com 30 dias", 
      isMet: accountAge >= 30, 
      current: `${accountAge} / 30 dias` 
    },
    { 
      label: `Selo Prata 🥈 (500 pts)`, 
      isMet: hasPoints, 
      current: `${currentPoints} / ${requiredPoints} pts` 
    },
    { 
      label: "Telefone verificado", 
      isMet: !!userProfile.isPhoneVerified, 
      current: userProfile.isPhoneVerified ? "Verificado ✅" : "Pendente ❌" 
    },
    { 
      label: "Mínimo 2 ajudas concluídas", 
      isMet: userProfile.helpsGiven >= 2, 
      current: `${userProfile.helpsGiven} / 2 concluídas` 
    },
    { 
      label: "Perfil sem denúncias", 
      isMet: (userProfile.reportCount || 0) === 0, 
      current: (userProfile.reportCount || 0) > 0 ? "Com denúncias" : "Limpo ✅" 
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[330px] rounded-3xl border-primary/20 z-[200] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="hidden">
          <DialogTitle>Acesso SOS Restrito</DialogTitle>
          <DialogDescription>Requisitos necessários para responder a pedidos SOS.</DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 p-4 text-center border-b">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-primary/20">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="font-headline text-lg text-primary font-black">🔒 Acesso SOS Restrito</h2>
          <p className="text-[11px] text-muted-foreground mt-1 px-2 leading-tight">
            Para ajudar em situações SOS precisas de ser um membro de confiança com selo <span className="font-black text-foreground">Prata 🥈</span> ou superior. Isto protege quem está em situação vulnerável.
          </p>
        </div>

        <div className="p-3 space-y-1.5 bg-white">
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 text-center">Progresso para Nível Prata</p>
          {requirements.map((req) => (
            <div key={req.label} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${req.isMet ? 'bg-primary/5 border-primary/10' : 'bg-secondary/20 border-transparent'}`}>
              <div className="flex items-center gap-2">
                {req.isMet ? (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive/30" />
                )}
                <span className={`text-[11px] font-bold ${req.isMet ? 'text-primary' : 'text-muted-foreground'}`}>{req.label}</span>
              </div>
              <span className={`text-[10px] font-black ${req.isMet ? 'text-primary' : 'text-muted-foreground/60'}`}>{req.current}</span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-muted/30 border-t">
          <Button className="w-full rounded-xl font-black h-10 shadow-lg shadow-primary/20 uppercase tracking-wide text-[10px]" onClick={onClose}>
            Entendi, vou continuar a ajudar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
