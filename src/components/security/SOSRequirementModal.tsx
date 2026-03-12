
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, XCircle, ShieldAlert, Lock, Zap, MapPin, Info } from "lucide-react";
import { differenceInDays } from "date-fns";

interface SOSRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  requiredSubtype?: string;
}

export default function SOSRequirementModal({ isOpen, onClose, userProfile, requiredSubtype }: SOSRequirementModalProps) {
  const accountAge = differenceInDays(new Date(), new Date(userProfile.joinedTimestamp));
  
  const getRequiredPoints = () => {
    switch(requiredSubtype) {
      case 'SOS Crítico': return 1000;
      case 'SOS Presencial': return 500;
      case 'SOS Informação': return 100;
      default: return 50;
    }
  };

  const getRequiredLevel = () => {
    switch(requiredSubtype) {
      case 'SOS Crítico': return 'Ouro 🥇';
      case 'SOS Presencial': return 'Prata 🥈';
      case 'SOS Informação': return 'Bronze 🥉';
      default: return 'Verificado 🛡️';
    }
  };

  const requiredPoints = getRequiredPoints();
  const requiredLevel = getRequiredLevel();
  const hasPoints = userProfile.points >= requiredPoints;

  const requirements = [
    { 
      label: "Conta com 30 dias", 
      isMet: accountAge >= 30, 
      current: `${accountAge} / 30 dias` 
    },
    { 
      label: `Selo ${requiredLevel}`, 
      isMet: hasPoints, 
      current: `${userProfile.points} / ${requiredPoints} pts` 
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
      <DialogContent className="max-w-[360px] rounded-3xl border-primary/20 z-[200] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="hidden">
          <DialogTitle>Acesso SOS Restrito</DialogTitle>
          <DialogDescription>Requisitos necessários para responder a pedidos SOS.</DialogDescription>
        </DialogHeader>

        <div className="bg-primary/5 p-6 text-center border-b">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border-2 border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-headline text-xl text-primary font-black">Acesso SOS Restrito</h2>
          <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">
            Ainda não podes responder a este SOS. Este tipo de ajuda requer selo <span className="font-black text-foreground">{requiredLevel}</span> ou superior para garantir a segurança de quem precisa. Continua a ajudar a comunidade para subir de nível! 💪
          </p>
        </div>

        <div className="p-4 space-y-2 bg-white">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 text-center">Teu Progresso para {requiredSubtype}</p>
          {requirements.map((req) => (
            <div key={req.label} className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${req.isMet ? 'bg-primary/5 border-primary/10' : 'bg-secondary/20 border-transparent'}`}>
              <div className="flex items-center gap-3">
                {req.isMet ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive/40" />
                )}
                <span className={`text-xs font-bold ${req.isMet ? 'text-primary' : 'text-muted-foreground'}`}>{req.label}</span>
              </div>
              <span className={`text-[10px] font-black ${req.isMet ? 'text-primary' : 'text-muted-foreground/60'}`}>{req.current}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted/30 border-t">
          <Button className="w-full rounded-2xl font-black h-12 shadow-lg shadow-primary/20 uppercase tracking-wide text-xs" onClick={onClose}>
            Entendi, vou continuar a ajudar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
