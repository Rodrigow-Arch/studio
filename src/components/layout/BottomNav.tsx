"use client";

import { Home, Users, PlusCircle, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { user } = useUser();
  const db = useFirestore();

  const unreadChatNotifsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      where('isRead', '==', false),
      where('type', '==', 'chat_message')
    );
  }, [db, user]);

  const { data: unreadChatNotifs } = useCollection(unreadChatNotifsQuery);
  const unreadChatCount = unreadChatNotifs?.length || 0;

  const tabs = [
    { id: 'feed', icon: Home, label: 'Início' },
    { id: 'groups', icon: Users, label: 'Grupos' },
    { id: 'add', icon: PlusCircle, label: 'Post', primary: true },
    { id: 'messages', icon: MessageCircle, label: 'Chat', badge: unreadChatCount },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t px-4 py-2 flex items-center justify-between z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all duration-200 p-2 rounded-xl min-w-[64px] relative",
              tab.primary ? "scale-110 -translate-y-2 bg-primary shadow-lg shadow-primary/30" : "text-muted-foreground",
              isActive && !tab.primary && "text-primary bg-secondary/50",
              tab.primary && "text-white"
            )}
          >
            <Icon className={cn("w-6 h-6", tab.primary && "w-7 h-7")} />
            {!tab.primary && <span className="text-[10px] font-medium">{tab.label}</span>}
            
            {tab.badge && tab.badge > 0 && (
              <Badge className="absolute top-1 right-2 h-4 w-4 flex items-center justify-center p-0 bg-destructive text-white border-white text-[8px] font-bold">
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}
