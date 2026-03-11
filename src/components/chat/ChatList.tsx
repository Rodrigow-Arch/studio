"use client";

import { useStore } from "@/lib/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";

export default function ChatList() {
  const { chats } = useStore();
  const chatIds = Object.keys(chats);

  return (
    <div className="p-4 space-y-6">
      <h2 className="font-headline text-2xl text-primary">Mensagens</h2>
      
      {chatIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium">Sem conversas ainda</h3>
            <p className="text-muted-foreground text-sm px-10">Candidata-te a ajudar alguém ou aceita uma ajuda para abrir um chat.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {chatIds.map(id => (
            <div key={id} className="flex items-center gap-3 p-3 hover:bg-secondary/30 rounded-2xl cursor-pointer transition-colors border">
              <Avatar className="w-12 h-12 bg-accent">
                <AvatarFallback className="text-white">?</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-sm">Conversa</p>
                <p className="text-xs text-muted-foreground line-clamp-1">Clica para abrir a conversa...</p>
              </div>
              <span className="text-[10px] text-muted-foreground">12:30</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}