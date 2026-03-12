
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, CheckCircle2, ExternalLink, Star } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, doc, updateDoc, where, getDocs, setDoc, serverTimestamp, writeBatch, increment, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function ChatRoom({ post, onBack, onProfileClick }: { post: any, onBack: () => void, onProfileClick?: (uid: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [isRatingOpen, setIsRatingOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [ratingComment, setRatingComment] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);
  
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const chatId = post.id;
  
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
    } catch (e) {
      // Ignore errors for typing status
    }
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
    const msg = text;
    setText('');
    updateTypingStatus(false);
    
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msg,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0],
        timestamp: new Date().toISOString()
      });

      const isAuthor = post.authorId === user.uid;
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
      
      // 1. Mark post as resolved and schedule deletion for 1 day later
      const postRef = doc(db, 'posts', post.id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      batch.update(postRef, { 
        status: 'resolvido',
        expiresAt: expiresAt.toISOString()
      });

      // 2. Create the rating
      const ratingRef = doc(collection(db, 'ratings'));
      batch.set(ratingRef, {
        id: ratingRef.id,
        stars: rating,
        comment: ratingComment,
        raterId: user.uid,
        raterUsername: post.authorUsername,
        ratedUserId: post.helperId,
        postId: post.id,
        timestamp: new Date().toISOString()
      });

      // 3. Update helper profile stats
      const helperRef = doc(db, 'users', post.helperId);
      const helperSnap = await getDoc(helperRef);
      const helperData = helperSnap.data();
      
      if (helperData) {
        const totalRatings = (helperData.totalRatings || 0) + 1;
        const oldAverage = helperData.averageRating || 0;
        const newAverage = ((oldAverage * (totalRatings - 1)) + rating) / totalRatings;
        
        batch.update(helperRef, {
          points: increment(50),
          helpsGiven: increment(1),
          totalRatings: totalRatings,
          averageRating: newAverage
        });
      }

      // 4. Delete all messages and typing indicators (full cleanup)
      const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
      messagesSnap.forEach(d => batch.delete(d.ref));
      
      const typingSnap = await getDocs(collection(db, 'chats', chatId, 'typing'));
      typingSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();

      toast({
        title: "Problema Resolvido!",
        description: "A ajuda foi concluída e o ajudante recebeu os pontos.",
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

  const isAuthor = post.authorId === user?.uid;
  const otherName = isAuthor ? (post.helperUsername || 'Ajudante') : post.authorUsername;
  const otherId = isAuthor ? post.helperId : post.authorId;

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col max-w-[480px] mx-auto">
      <header className="p-3 border-b bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <Avatar 
              className="w-8 h-8 bg-primary cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => otherId && onProfileClick?.(otherId)}
            >
              <AvatarFallback className="text-white text-xs">{otherName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="cursor-pointer" onClick={() => otherId && onProfileClick?.(otherId)}>
              <p className="text-sm font-bold leading-none hover:text-primary transition-colors">{otherName}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                Post: {post.type} <ExternalLink className="w-2 h-2" />
              </p>
            </div>
          </div>
        </div>
        {isAuthor && post.status !== 'resolvido' && (
          <Button 
            size="sm" 
            variant="default" 
            className="h-8 text-[10px] bg-primary text-white font-bold" 
            onClick={() => setIsRatingOpen(true)}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolvido
          </Button>
        )}
      </header>

      <div className="px-4 py-2 bg-secondary/20 border-b flex justify-between items-center">
        <p className="text-[10px] text-muted-foreground line-clamp-1 italic">"{post.text}"</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5">
        {messages?.map((msg) => {
          const isMe = msg.authorId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-foreground rounded-tl-none border'
              }`}>
                <p>{msg.text}</p>
                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {format(new Date(msg.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
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
            className="rounded-full bg-secondary/50 border-none"
          />
          <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!text}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
        <DialogContent className="max-w-[400px] rounded-3xl z-[100]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Avalia a ajuda de {otherName}</DialogTitle>
            <DialogDescription>
              Podes avaliar com meias estrelas. A tua avaliação ajuda a manter a confiança na comunidade.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6 gap-6">
            <div className="flex gap-1">
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((val) => (
                <button 
                  key={val} 
                  type="button"
                  onClick={() => handleStarClick(val)}
                  className={`transition-all ${rating === val ? 'scale-125' : 'hover:scale-110'}`}
                >
                  <Star 
                    className={`w-6 h-6 ${val <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground opacity-30'}`} 
                  />
                  <span className="text-[8px] block mt-1">{val}</span>
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
