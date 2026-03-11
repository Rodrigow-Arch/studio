"use client";

import { Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function Header({ onNotificationClick }: { onNotificationClick: () => void }) {
  const { notifications } = useStore();
  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
          <span className="text-white font-headline text-lg">P</span>
        </div>
        <h1 className="font-headline text-xl text-primary">Portugal Unido</h1>
      </div>

      <button onClick={onNotificationClick} className="relative p-2 rounded-full hover:bg-muted transition-colors">
        <Bell className="w-6 h-6 text-muted-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-white border-white">
            {unreadCount}
          </Badge>
        )}
      </button>
    </header>
  );
}