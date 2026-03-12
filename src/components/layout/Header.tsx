
"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function Header({ onNotificationClick }: { onNotificationClick: () => void }) {
  const { user } = useUser();
  const db = useFirestore();

  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      where('isRead', '==', false)
    );
  }, [db, user]);

  const { data: unreadNotifications } = useCollection(unreadNotifsQuery);
  const unreadCount = unreadNotifications?.length || 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex flex-col shadow-sm border border-black/5">
          <div className="flex-[2] bg-[#055a36] flex items-center justify-center">
            <span className="text-sm">🤝</span>
          </div>
          <div className="h-[1.5px] bg-[#fcd116]" />
          <div className="flex-1 bg-[#ce1126] flex items-center justify-center">
            <span className="text-white font-headline text-[7px] font-black tracking-tight">PU</span>
          </div>
        </div>
        <h1 className="font-headline text-lg text-primary leading-none mt-1">Portugal Unido</h1>
      </div>

      <button onClick={onNotificationClick} className="relative p-2 rounded-full hover:bg-muted transition-colors">
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-0 -right-0 h-4 w-4 flex items-center justify-center p-0 bg-destructive text-white border-2 border-white text-[8px] font-bold">
            {unreadCount}
          </Badge>
        )}
      </button>
    </header>
  );
}
