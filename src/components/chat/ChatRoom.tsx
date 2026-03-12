"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, CheckCircle2, Star } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, doc, updateDoc, where, getDocs, setDoc, serverTimestamp, writeBatch, increment, getDoc, deleteDoc } from "firebase/firestore";
import { format, isToday, isYesterday, isSameDay, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from '@/lib/badge-logic';
import { getTrustLevel } from '@/lib/trust-levels';
import EmergencyModal from '../security/EmergencyModal';
import { filterProfanity, isUserOnline } from '@/lib/utils';

export default function ChatRoom({ post, onBack, onProfileClick }: { post: any, onBack: () => void, onProfileClick?: (uid: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [isRatingOpen, setIsRatingOpen] = React.useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [ratingComment, setRatingComment] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const chatId = post.id;
  const isAuthor = post.authorId === user?.uid;
  const otherId = isAuthor ? post.helperId : post.authorId;

  const otherProfileRef = useMemoFirebase(() => otherId ? doc(db, 'users', otherId) : null, [db, otherId]);
  const { data: otherProfile } = useDoc(otherProfileRef);
  
  const messagesQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
  }, [db, chatId]);

  const typingQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'chats', chatId, 'typing'),
      where('isTyping', '==', true)
    );
  }, [db, chatId]);

  const { data: messages } = useCollection(messagesQuery);
  const { data: typingUsers } = useCollection(typingQuery);

  const othersTyping = React.useMemo(() => {
    if (!typingUsers || !user) return [];
    return typingUsers.filter(u => u.id !== user.uid);
  }, [typingUsers, user]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, othersTyping]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user || !chatId) return;
    const typingDocRef = doc(db, 'chats', chatId, 'typing', user.uid);
    try {
      if (isTyping) {
        await setDoc(typingDocRef, {
          isTyping: true,
          username: post.authorId === user.uid ? post.authorUsername : (post.helperUsername || 'Ajudante'),
          timestamp: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(typingDocRef, { isTyping: false }, { merge: true });
      }
    } catch (e) {}
  };

  const handleInputChange = (val: string) => {
    setText(val);
    if (val.length > 0) {
      updateTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(false);
      }, 3000);
    } else {
      updateTypingStatus(false);
    }
  };

  const handleSend = async () => {
    if (!text || !user) return;
    
    // Aplicar filtro de profanidade
    const cleanMsg = filterProfanity(text);
    
    setText('');
    updateTypingStatus(false);
    
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: cleanMsg,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0],
        timestamp: new Date().toISOString()
      });

      const recipientId = isAuthor ? post.helperId : post.authorId;

      if (recipientId) {
        await addDoc(collection(db, 'users', recipientId, 'notifications'), {
          userId: recipientId,
          type: 'chat_message',
          message: `Nova mensagem de ${isAuthor ? post.authorUsername : (post.helperUsername || 'Ajudante')}`,
          postId: post.id,
          chatId: chatId,
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar mensagem" });
    }
  };

  const finalizeResolution = async () => {
    if (!user || !post.helperId || isResolving) return;
    setIsResolving(true);
    
    try {
      const batch = writeBatch(db);
      
      const postRef = doc(db, 'posts', post.id);
      
      // ELIMINAÇÃO AUTOMÁTICA: Em vez de atualizar o status, deletamos o post
      batch.delete(postRef);

      // Limpar subcoleções do post (comentários e candidaturas)
      const commentsSnap = await getDocs(collection(db, 'posts', post.id, 'comments'));
      commentsSnap.forEach(d => batch.delete(d.ref));

      const applicationsSnap = await getDocs(collection(db, 'posts', post.id, 'applications'));
      applicationsSnap.forEach(d => batch.delete(d.ref));

      // Aplicar filtro no comentário de avaliação também
      const cleanRatingComment = filterProfanity(ratingComment);

      const ratingRef = doc(collection(db, 'ratings'));
      batch.set(ratingRef, {
        id: ratingRef.id,
        stars: rating,
        comment: cleanRatingComment,
        raterId: user.uid,
        raterUsername: post.authorUsername,
        ratedUserId: post.helperId,
        postId: post.id,
        timestamp: new Date().toISOString()
      });

      const helperRef = doc(db, 'users', post.helperId);
      const helperSnap = await getDoc(helperRef);
      const helperData = helperSnap.data();
      
      if (helperData) {
        const totalRatings = (helperData.totalRatings || 0) + 1;
        const oldAverage = helperData.averageRating || 0;
        const newAverage = ((oldAverage * (totalRatings - 1)) + rating) / totalRatings;
        
        let pointsToAward = 20; 
        if (post.type === 'SOS') pointsToAward += 30;
        if (post.type === 'Partilha') pointsToAward += 10;
        
        if (rating === 5) pointsToAward += 15;
        else if (rating === 4) pointsToAward += 10;
        else if (rating === 3) pointsToAward += 5;

        const updateObj: any = {
          points: increment(pointsToAward),
          helpsGiven: increment(1),
          totalRatings: totalRatings,
          averageRating: newAverage
        };

        if (post.type === 'SOS') updateObj.sosResolved = increment(1);
        if (post.paymentAmount > 0) updateObj.paidTasksCompleted = increment(1);

        batch.update(helperRef, updateObj);
      }

      // Limpar o chat associado
      const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
      messagesSnap.forEach(d => batch.delete(d.ref));
      
      const typingSnap = await getDocs(collection(db, 'chats', chatId, 'typing'));
      typingSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      await checkAndAwardBadges(db, post.helperId);

      toast({
        title: "Problema Resolvido!",
        description: `A ajuda foi concluída e o post foi arquivado definitivamente.`,
      });
      setIsRatingOpen(false);
      onBack();
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao finalizar ajuda" });
    } finally {
      setIsResolving(false);
    }
  };

  React.useEffect(() => {
    if (!user || !chatId) return;
    const clearNotifs = async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'notifications'),
          where('postId', '==', post.id),
          where('type', '==', 'chat_message'),
          where('isRead', '==', false)
        );
        const snap = await getDocs(q);
        snap.forEach(d => {
          updateDoc(d.ref, { isRead: true });
        });
      } catch (e) {}
    };
    clearNotifs();

    return () => {
      if (user && chatId) {
        updateTypingStatus(false);
      }
    };
  }, [user, chatId, db, post.id]);

  const renderDateSeparator = (currentMsg: any, prevMsg: any) => {
    const currentDate = new Date(currentMsg.timestamp);
    if (!prevMsg || !isSameDay(new Date(prevMsg.timestamp), currentDate)) {
      let dateLabel = '';
      if (isToday(currentDate)) {
        dateLabel = `Hoje, ${format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}`;
      } else if (isYesterday(currentDate)) {
        dateLabel = 'Ontem';
      } else if (differenceInDays(new Date(), currentDate) < 7) {
        dateLabel = format(currentDate, 'EEEE', { locale: pt });
      } else {
        dateLabel = format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: pt });
      }

      return (
        <div className="flex justify-center my-6 sticky top-2 z-10 pointer-events-none">
          <span className="text-[10px] bg-white/90 backdrop-blur-sm border shadow-sm px-4 py-1.5 rounded-full text-muted-foreground font-black uppercase tracking-widest pointer-events-auto">
            {dateLabel}
          </span>
        </div>
      );
    }
    return null;
  };

  const otherName = isAuthor ? (post.helperUsername || 'Ajudante') : post.authorUsername;
  const trustLevel = otherProfile ? getTrustLevel(otherProfile.points || 0) : null;
  const isOnline = otherProfile ? isUserOnline(otherProfile.lastActive) : false;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col max-w-[480px] mx-auto">
      <header className="p-1 border-b bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-0.5 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex items-center gap-1 min-w-0">
            <Avatar 
              className="w-7 h-7 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => otherId && onProfileClick?.(otherId)}
            >
              {otherProfile?.photoUrl && <AvatarImage src={otherProfile.photoUrl} className="object-cover" />}
              <AvatarFallback className="text-white text-[9px] bg-primary font-bold">
                {otherName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="cursor-pointer min-w-0" onClick={() => otherId && onProfileClick?.(otherId)}>
              <div className="flex items-center gap-0.5 min-w-0">
                <p className="text-xs font-bold leading-none hover:text-primary transition-colors truncate">{otherName}</p>
                {trustLevel && <span className="text-xs" title={trustLevel.label}>{trustLevel.icon}</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-1.5 text-[8px] text-destructive hover:bg-destructive/10 font-black border border-destructive/20 rounded-full"
            onClick={() => setIsEmergencyOpen(true)}
          >
            🆘 SOS
          </Button>
          {isAuthor && post.status !== 'resolvido' && (
            <Button 
              size="sm" 
              variant="default" 
              className="h-7 px-2 text-[9px] bg-primary text-white font-bold rounded-full shadow-sm" 
              onClick={() => setIsRatingOpen(true)}
            >
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Resolvido
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 py-1.5 bg-secondary/20 border-b flex justify-between items-center shrink-0">
        <p className="text-[9px] text-muted-foreground line-clamp-1 italic">"{post.text}"</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5">
        {messages?.map((msg, idx) => {
          const isMe = msg.authorId === user?.uid;
          return (
            <React.Fragment key={msg.id}>
              {renderDateSeparator(msg, idx > 0 ? messages[idx - 1] : null)}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-2.5 rounded-2xl text-sm shadow-sm border ${
                  isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-foreground rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <p className="text-[8px] mt-1 text-muted-foreground px-1">
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </React.Fragment>
          );
        })}
        
        {othersTyping.length > 0 && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white/50 px-3 py-1 rounded-full border text-[10px] text-muted-foreground italic flex items-center gap-2">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              {othersTyping[0].username} está a escrever...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-white flex flex-col gap-2 shrink-0">
        <div className="flex gap-2">
          <Input 
            placeholder="Escreve uma mensagem..." 
            value={text} 
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="rounded-full bg-secondary/50 border-none h-10 text-sm"
          />
          <Button size="icon" className="rounded-full shrink-0 h-10 w-10" onClick={handleSend} disabled={!text}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />

      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="max-w-[400px] rounded-3xl z-[100]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Avalia a ajuda de {otherName}</DialogTitle>
            <DialogDescription>
              A tua avaliação ajuda a manter a confiança na comunidade.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6 gap-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button 
                  key={val} 
                  type="button"
                  onClick={() => setRating(val)}
                  className={`transition-all ${rating === val ? 'scale-125' : 'hover:scale-110'}`}
                >
                  <Star 
                    className={`w-6 h-6 ${val <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground opacity-30'}`} 
                  />
                </button>
              ))}
            </div>
            
            <Input 
              placeholder="Escreve um pequeno comentário (opcional)" 
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="text-center rounded-xl"
            />
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsRatingOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold" onClick={finalizeResolution} disabled={isResolving}>
              {isResolving ? "A guardar..." : "Concluir e Pontuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
