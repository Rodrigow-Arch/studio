
"use client";

import * as React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import ChatRoom from './ChatRoom';

interface ChatListProps {
  onProfileClick: (uid: string) => void;
}

export default function ChatList({ onProfileClick }: ChatListProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [activeChat, setActiveChat] = React.useState<any | null>(null);

  // Filter only active chats ('em curso'). 
  // Once 'resolvido', the chat disappears from the list immediately as requested.
  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'posts'),
      where('status', '==', 'em curso')
    );
  }, [db, user]);

  const { data: allActivePosts, isLoading } = useCollection(chatsQuery);

  // Busca notificações de mensagens não lidas para marcar na lista
  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      where('type', '==', 'chat_message'),
      where('isRead', '==', false)
    );
  }, [db, user]);

  const { data: unreadNotifs } = useCollection(unreadNotifsQuery);

  const filteredChats = React.useMemo(() => {
    if (!allActivePosts || !user) return [];
    return allActivePosts.filter(p => p.authorId === user.uid || p.helperId === user.uid);
  }, [allActivePosts, user]);

  if (activeChat) {
    return (
      <ChatRoom 
        post={activeChat} 
        onBack={() => setActiveChat(null)} 
        onProfileClick={onProfileClick}
      />
    );
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
            const otherName = isAuthor ? (post.helperUsername || 'Ajudante') : post.authorUsername;
            
            // Conta notificações não lidas específicas para este post
            const unreadCount = unreadNotifs?.filter(n => n.postId === post.id).length || 0;
            
            return (
              <div 
                key={post.id} 
                className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer hover:shadow-sm transition-all ${unreadCount > 0 ? 'bg-primary/5 border-primary/20' : 'bg-white'}`}
                onClick={() => setActiveChat(post)}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 bg-primary">
                    <AvatarFallback className="text-white font-bold">{otherName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'font-black text-primary' : 'font-bold'}`}>
                      {otherName}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">Post: {post.text}</p>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <Badge variant="outline" className={`text-[9px] uppercase border-primary/30 text-primary`}>
                    {post.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
