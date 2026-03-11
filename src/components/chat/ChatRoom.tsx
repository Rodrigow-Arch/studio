"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, CheckCircle2, ExternalLink } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { format } from "date-fns";

export default function ChatRoom({ post, onBack, onProfileClick }: { post: any, onBack: () => void, onProfileClick?: (uid: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const chatId = post.id;
  
  const messagesQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
  }, [db, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text || !user) return;
    const msg = text;
    setText('');
    
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

  // Limpar notificações de mensagem ao entrar no chat
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
      </div>

      <div className="p-3 border-t bg-white flex gap-2 shrink-0">
        <Input 
          placeholder="Escreve uma mensagem..." 
          value={text} 
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="rounded-full bg-secondary/50 border-none"
        />
        <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!text}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
