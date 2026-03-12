
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, XCircle, Info } from "lucide-react";
import { differenceInDays } from "date-fns";

interface SOSRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
}

export default function SOSRequirementModal({ isOpen, onClose, userProfile }: SOSRequirementModalProps) {
  const accountAge = differenceInDays(new Date(), new Date(userProfile.joinedTimestamp));
  
  const requirements = [
    { 
      label: "Conta com 30 dias", 
      isMet: accountAge >= 30, 
      current: `${accountAge} de 30 dias` 
    },
    { 
      label: "3 avaliações com 4.0+", 
      isMet: userProfile.totalRatings >= 3 && userProfile.averageRating >= 4.0, 
      current: `${userProfile.totalRatings} avaliações (${userProfile.averageRating.toFixed(1)})` 
    },
    { 
      label: "50 pontos de gratidão", 
      isMet: userProfile.points >= 50, 
      current: `${userProfile.points} de 50 pts` 
    },
    { 
      label: "Telefone verificado", 
      isMet: !!userProfile.isPhoneVerified, 
      current: userProfile.isPhoneVerified ? "Sim" : "Não" 
    },
    { 
      label: "2 ajudas concluídas", 
      isMet: userProfile.helpsGiven >= 2, 
      current: `${userProfile.helpsGiven} de 2 ajudas` 
    },
    { 
      label: "Sem denúncias", 
      isMet: (userProfile.reportCount || 0) === 0, 
      current: userProfile.reportCount || 0 
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] rounded-3xl border-primary/20 z-[200]">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="font-headline text-lg">Acesso Restrito a SOS</DialogTitle>
          <DialogDescription className="text-xs">
            Para responder a SOS precisas de ser um membro verificado e experiente. Protegemos quem precisa de ajuda urgente. 🛡️
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {requirements.map((req) => (
            <div key={req.label} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-transparent">
              <div className="flex items-center gap-3">
                {req.isMet ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <span className="text-xs font-bold">{req.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{req.current}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button className="w-full rounded-2xl font-bold h-10" onClick={onClose}>
            Entendi, vou continuar a participar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
