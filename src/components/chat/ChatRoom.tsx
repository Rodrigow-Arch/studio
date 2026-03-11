"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, CheckCircle2, ExternalLink } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, doc, updateDoc, where, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";

export default function ChatRoom({ post, onBack, onProfileClick }: { post: any, onBack: () => void, onProfileClick?: (uid: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const chatId = post.id;
  
  // Queries
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

  // Scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, othersTyping]);

  // Typing status management
  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user || !chatId) return;
    const typingDocRef = doc(db, 'chats', chatId, 'typing', user.uid);
    if (isTyping) {
      await setDoc(typingDocRef, {
        isTyping: true,
        username: post.authorId === user.uid ? post.authorUsername : (post.helperUsername || 'Ajudante'),
        timestamp: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(typingDocRef, { isTyping: false }, { merge: true });
    }
  };

  const handleInputChange = (val: string) => {
    setText(val);
    
    // Manage typing indicator
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
    
    // 1. Enviar mensagem
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: msg,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0],
      timestamp: new Date().toISOString()
    });

    // 2. Notificar o destinatário
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
  };

  const markResolved = async () => {
    if (confirm("Marcar este problema como resolvido?")) {
      await updateDoc(doc(db, 'posts', post.id), {
        status: 'resolvido'
      });
      onBack();
    }
  };

  // Limpar notificações ao entrar
  React.useEffect(() => {
    if (!user || !chatId) return;
    const clearNotifs = async () => {
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
    };
    clearNotifs();

    // Cleanup typing status on unmount
    return () => {
      if (user && chatId) {
        updateTypingStatus(false);
      }
    };
  }, [user, chatId, db, post.id]);

  const isAuthor = post.authorId === user?.uid;
  const otherName = isAuthor ? (post.helperUsername || 'Ajudante') : post.authorUsername;
  const otherId = isAuthor ? post.helperId : post.authorId;

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
          <Button size="sm" variant="outline" className="h-8 text-[10px] border-primary text-primary" onClick={markResolved}>
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
    </div>
  );
}