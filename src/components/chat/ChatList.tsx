"use client";

import * as React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Clock } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import ChatRoom from './ChatRoom';

export default function ChatList() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeChat, setActiveChat] = React.useState<any | null>(null);

  // Procurar posts onde o user é autor OU ajudante e o status é "em curso" ou "resolvido"
  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'posts'),
      where('status', 'in', ['em curso', 'resolvido'])
    );
  }, [db, user]);

  const { data: allActivePosts, isLoading } = useCollection(chatsQuery);

  const filteredChats = React.useMemo(() => {
    if (!allActivePosts || !user) return [];
    return allActivePosts.filter(p => p.authorId === user.uid || p.helperId === user.uid);
  }, [allActivePosts, user]);

  if (activeChat) {
    return <ChatRoom post={activeChat} onBack={() => setActiveChat(null)} />;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="font-headline text-2xl text-primary">Conversas</h2>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-secondary/30 animate-pulse rounded-2xl" />)}
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">Sem conversas ativas</h3>
            <p className="text-muted-foreground text-sm px-10">Aceita uma ajuda ou sê aceite para começar a conversar.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChats.map(post => {
            const isAuthor = post.authorId === user?.uid;
            const otherName = isAuthor ? post.helperName || 'Ajudante' : post.authorUsername;
            
            return (
              <div 
                key={post.id} 
                className="flex items-center gap-3 p-3 bg-white border rounded-2xl cursor-pointer hover:shadow-sm transition-all"
                onClick={() => setActiveChat(post)}
              >
                <Avatar className="w-12 h-12 bg-primary">
                  <AvatarFallback className="text-white font-bold">{otherName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{otherName}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">Post: {post.text}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[9px] uppercase">{post.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}