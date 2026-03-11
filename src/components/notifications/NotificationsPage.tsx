"use client";

import * as React from 'react';
import { useStore, store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, HandHeart, AlertTriangle, Share2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export default function NotificationsPage({ onClose }: { onClose: () => void }) {
  const { notifications } = useStore();

  const getIcon = (type: string) => {
    switch(type) {
      case 'SOS': return <AlertTriangle className="text-red-500" />;
      case 'Ajuda': return <HandHeart className="text-blue-500" />;
      case 'Partilha': return <Share2 className="text-green-500" />;
      case 'Evento': return <Calendar className="text-purple-500" />;
      default: return <CheckCircle2 className="text-primary" />;
    }
  };

  const markAllRead = () => {
    store.notifications = store.notifications.map(n => ({ ...n, lida: true }));
    store.save();
  };

  React.useEffect(() => {
    // Component unmount mark as read logic could go here
  }, []);

  return (
    <div className="animate-in slide-in-from-right-full duration-300 h-full bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <h2 className="font-headline text-xl">Notificações</h2>
        </div>
        <Button variant="link" size="sm" onClick={markAllRead}>Marcar lidas</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 opacity-50">
            <CheckCircle2 className="w-12 h-12 text-muted" />
            <p className="text-sm">Tudo em dia!</p>
            <p className="text-xs">Quando alguém da tua zona precisar de ajuda, aparece aqui.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-2xl flex gap-3 border transition-colors ${notif.lida ? 'bg-white opacity-60' : 'bg-white border-primary/20 shadow-sm'}`}
              onClick={() => {
                const updated = store.notifications.find(n => n.id === notif.id);
                if (updated) {
                  updated.lida = true;
                  store.save();
                }
              }}
            >
              <div className="mt-1">{getIcon(notif.tipo)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-tight">{notif.mensagem}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(notif.ts, { addSuffix: true, locale: pt })}</span>
                  {!notif.lida && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}