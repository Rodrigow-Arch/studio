
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const accepted = localStorage.getItem('pu_cookies_accepted');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('pu_cookies_accepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-[440px] mx-auto z-[400] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white/95 backdrop-blur-md border border-primary/10 shadow-2xl p-4 rounded-3xl flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Aviso de Cookies</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Usamos cookies apenas para manter a tua sessão ativa. Sem tracking, sem publicidade.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsVisible(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
        <Button className="w-full h-10 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90" onClick={handleAccept}>
          Aceitar e Continuar
        </Button>
      </div>
    </div>
  );
}
