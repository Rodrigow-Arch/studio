"use client";

import { Home, Users, PlusCircle, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'feed', icon: Home, label: 'Início' },
    { id: 'groups', icon: Users, label: 'Grupos' },
    { id: 'add', icon: PlusCircle, label: 'Post', primary: true },
    { id: 'messages', icon: MessageCircle, label: 'Chat' },
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
              "flex flex-col items-center justify-center gap-1 transition-all duration-200 p-2 rounded-xl min-w-[64px]",
              tab.primary ? "scale-110 -translate-y-2 bg-primary shadow-lg shadow-primary/30" : "text-muted-foreground",
              isActive && !tab.primary && "text-primary bg-secondary/50",
              tab.primary && "text-white"
            )}
          >
            <Icon className={cn("w-6 h-6", tab.primary && "w-7 h-7")} />
            {!tab.primary && <span className="text-[10px] font-medium">{tab.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}