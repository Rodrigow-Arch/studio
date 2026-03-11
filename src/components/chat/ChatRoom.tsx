"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";

export default function ChatRoom({ post, onBack }: { post: any, onBack: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const chatId = post.id; // Usamos o ID do post como identificador único da conversa
  
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
    
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: msg,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0],
      timestamp: new Date().toISOString()
    });
  };

  const markResolved = async () => {
    if (confirm("Marcar este problema como resolvido?")) {
      await updateDoc(doc(db, 'posts', post.id), {
        status: 'resolvido'
      });
      onBack();
    }
  };

  const isAuthor = post.authorId === user?.uid;
  const otherName = isAuthor ? 'Ajudante' : post.authorUsername;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col max-w-[480px] mx-auto">
      <header className="p-3 border-b bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 bg-primary">
              <AvatarFallback className="text-white text-xs">{otherName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold leading-none">{otherName}</p>
              <p className="text-[10px] text-muted-foreground">Post: {post.type}</p>
            </div>
          </div>
        </div>
        {isAuthor && post.status !== 'resolvido' && (
          <Button size="sm" variant="outline" className="h-8 text-[10px] border-primary text-primary" onClick={markResolved}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolvido
          </Button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10">
        {messages?.map((msg) => {
          const isMe = msg.authorId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-foreground rounded-tl-none'
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