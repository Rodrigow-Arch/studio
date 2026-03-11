"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, HandHeart, AlertTriangle, Share2, Calendar, X, UserCheck, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, addDoc, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface NotificationsPageProps {
  onClose: () => void;
  onProfileClick: (uid: string) => void;
  onAction: (type: string, data?: any) => void;
}

export default function NotificationsPage({ onClose, onProfileClick, onAction }: NotificationsPageProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    return user ? query(collection(db, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc')) : null;
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);

  const getIcon = (type: string) => {
    switch(type) {
      case 'SOS': return <AlertTriangle className="text-red-500" />;
      case 'application': return <HandHeart className="text-accent" />;
      case 'Ajuda': return <HandHeart className="text-blue-500" />;
      case 'Partilha': return <Share2 className="text-green-500" />;
      case 'Evento': return <Calendar className="text-purple-500" />;
      case 'chat_message': return <MessageCircle className="text-primary" />;
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
    } else if (notif.postId) {
      onAction('feed', { postId: notif.postId });
    }
  };

  return (
    <div className="animate-in slide-in-from-right-full duration-300 h-full bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}><ArrowLeft className="w-5 h-5" /></Button>
          <h2 className="font-headline text-xl">Notificações</h2>
        </div>
        <Button variant="link" size="sm" onClick={markAllRead}>Lidas</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {!notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 opacity-50">
            <CheckCircle2 className="w-12 h-12 text-muted" />
            <p className="text-sm">Tudo em dia!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-2xl flex flex-col gap-3 border transition-colors cursor-pointer ${notif.isRead ? 'bg-white opacity-60' : 'bg-white border-primary/20 shadow-sm'}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="flex gap-3">
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight">{notif.message}</p>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: pt })}</span>
                </div>
              </div>

              {notif.type === 'application' && !notif.accepted && (
                <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                  <Button size="sm" className="flex-1 h-8 text-[11px] bg-accent hover:bg-accent/90" onClick={() => handleAccept(notif)}>
                    <UserCheck className="w-3 h-3 mr-1" /> Candidatá-lo/a
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleReject(notif)}>
                    <X className="w-3 h-3 mr-1" /> Cancelar
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
