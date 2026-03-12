
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, HandHeart, AlertTriangle, Share2, Calendar, X, UserCheck, MessageCircle, Award, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, addDoc, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { getTrustLevel } from '@/lib/trust-levels';

interface NotificationsPageProps {
  onClose: () => void;
  onProfileClick: (uid: string) => void;
  onAction: (type: string, data?: any) => void;
}

export default function NotificationsPage({ onClose, onProfileClick, onAction }: NotificationsPageProps) {
  const { user } = user ? useUser() : { user: null };
  const db = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    return user ? query(collection(db, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc')) : null;
  }, [db, user]);

  const { data: rawNotifications } = useCollection(notificationsQuery);

  const notifications = React.useMemo(() => {
    if (!rawNotifications) return [];
    
    // Para candidaturas, queremos ordená-las por pontos se houver múltiplas para o mesmo post
    // Mas as notificações no geral mantêm ordem cronológica.
    // No entanto, se o utilizador clicar numa notificação de candidatura, podemos mostrar
    // a lista de candidatos ordenados no futuro. Por agora, marcamos as individuais.
    return rawNotifications;
  }, [rawNotifications]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'SOS': return <AlertTriangle className="text-red-500" />;
      case 'application': return <HandHeart className="text-accent" />;
      case 'Ajuda': return <HandHeart className="text-blue-500" />;
      case 'Partilha': return <Share2 className="text-green-500" />;
      case 'Evento': return <Calendar className="text-purple-500" />;
      case 'chat_message': return <MessageCircle className="text-primary" />;
      case 'badge': return <Award className="text-yellow-500" />;
      default: return <CheckCircle2 className="text-primary" />;
    }
  };

  const handleAccept = async (notif: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'posts', notif.postId), {
        status: 'em curso',
        helperId: notif.applicantId,
        helperUsername: notif.applicantUsername || 'Ajudante'
      });

      await addDoc(collection(db, 'users', notif.applicantId, 'notifications'), {
        userId: notif.applicantId,
        type: 'accepted',
        message: `A tua candidatura para ajudar foi aceite! Já podes conversar com o autor no chat.`,
        postId: notif.postId,
        isRead: false,
        timestamp: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', user.uid, 'notifications', notif.id), {
        isRead: true,
        accepted: true
      });

      toast({ 
        title: "Candidatura aceite!", 
        description: "Agora podes combinar os detalhes no Chat.",
      });
      onAction('chat');
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao aceitar candidatura" });
    }
  };

  const handleReject = async (notif: any) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notif.id));
      toast({ title: "Candidatura removida" });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao rejeitar" });
    }
  };

  const markAllRead = async () => {
    if (!user || !notifications) return;
    const batchPromises = notifications.filter(n => !n.isRead).map(n => 
      updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { isRead: true })
    );
    await Promise.all(batchPromises);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead && user) {
      await updateDoc(doc(db, 'users', user.uid, 'notifications', notif.id), { isRead: true });
    }
    
    if (notif.type === 'chat_message' || notif.type === 'accepted') {
      onAction('chat');
    } else if (notif.type === 'badge') {
      onAction('profile');
    } else if (notif.postId) {
      onAction('feed', { postId: notif.postId });
    }
  };

  return (
    <div className="animate-in slide-in-from-right-full duration-500 h-full bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="active:scale-90" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <h2 className="font-headline text-xl text-primary">Notificações</h2>
        </div>
        <Button variant="link" size="sm" className="font-bold text-xs" onClick={markAllRead}>Marcar todas lidas</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20 relative">
        {!notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-muted" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Tudo em dia por aqui!</p>
          </div>
        ) : (
          notifications.map((notif, idx) => {
            const trustLevel = notif.applicantPoints ? getTrustLevel(notif.applicantPoints) : null;
            const isHighlight = trustLevel && (trustLevel.minPoints >= 1000);

            return (
              <div 
                key={notif.id} 
                className={`p-4 rounded-2xl flex flex-col gap-3 border transition-all cursor-pointer active:scale-[0.98] animate-in fade-in slide-in-from-right-4 
                  ${notif.isRead ? 'bg-white opacity-60' : 'bg-white border-primary/20 shadow-sm'}
                  ${isHighlight ? 'ring-2 ring-yellow-400 bg-yellow-50/50' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex gap-3">
                  <div className="mt-1 p-2 bg-secondary/20 rounded-xl">{getIcon(notif.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm leading-tight ${notif.isRead ? 'font-normal' : 'font-bold'}`}>{notif.message}</p>
                      {trustLevel && (
                        <span className="text-xs" title={trustLevel.label}>{trustLevel.icon}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: pt })}
                    </span>
                  </div>
                  {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-2 animate-pulse" />}
                </div>

                {notif.type === 'application' && !notif.accepted && (
                  <div className="flex flex-col gap-2 pt-1" onClick={e => e.stopPropagation()}>
                    {trustLevel && (
                      <div className={`px-2 py-1 rounded-lg ${trustLevel.bg} ${trustLevel.color} text-[9px] font-black uppercase flex items-center gap-1 w-fit`}>
                        <Award className="w-3 h-3" /> {trustLevel.label}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-8 text-[11px] bg-accent hover:bg-accent/90 active:scale-95 transition-transform" onClick={() => handleAccept(notif)}>
                        <UserCheck className="w-3 h-3 mr-1" /> Candidatá-lo/a
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] text-destructive border-destructive/20 hover:bg-destructive/5 active:scale-95 transition-transform" onClick={() => handleReject(notif)}>
                        <X className="w-3 h-3 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
