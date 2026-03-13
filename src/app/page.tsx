
"use client";

import * as React from 'react';
import AuthFlow from '@/components/auth/AuthFlow';
import BottomNav from '@/components/layout/BottomNav';
import Feed from '@/components/feed/Feed';
import ProfilePage from '@/components/profile/ProfilePage';
import GroupsPage from '@/components/groups/GroupsPage';
import ChatList from '@/components/chat/ChatList';
import NotificationsPage from '@/components/notifications/NotificationsPage';
import CreatePost from '@/components/feed/CreatePost';
import { Header } from '@/components/layout/Header';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isOnline, setIsOnline] = React.useState(true);
  
  const userDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const [activeTab, setActiveTab] = React.useState('feed');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [viewingUserId, setViewingUserId] = React.useState<string | null>(null);

  // Monitorização de Estado Online / Offline
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Heartbeat de Presença
  React.useEffect(() => {
    if (!user || !userProfile || !isOnline) return;

    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: new Date().toISOString()
        });
      } catch (e) {
        // Heartbeat falhou silenciosamente
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 60000);
    return () => clearInterval(interval);
  }, [user, userProfile, db, isOnline]);

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-10 text-center space-y-6">
        <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
          <WifiOff className="w-16 h-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="font-headline text-3xl text-primary">Estás Offline</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            O Portugal Unido precisa de internet para te ligar à tua comunidade. Verifica o teu Wi-Fi ou Dados Móveis.
          </p>
        </div>
        <Button 
          onClick={() => typeof window !== 'undefined' && window.location.reload()} 
          className="rounded-2xl h-12 px-8 font-black gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Tentar Religar
        </Button>
      </div>
    );
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border-4 border-accent animate-flag">
            <div className="flex-[2] bg-[#005C2E] flex items-center justify-center">
              <span className="text-3xl">🤝</span>
            </div>
            <div className="h-[3px] bg-[#FFD700]" />
            <div className="flex-1 bg-[#C8102E] flex items-center justify-center">
              <span className="text-white font-headline text-[10px] font-black tracking-widest">PU</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Portugal Unido</p>
            <p className="text-[10px] text-muted-foreground font-medium">A carregar o teu mundo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthFlow />;
  }

  const handleProfileClick = (uid: string) => {
    setViewingUserId(uid);
  };

  const handleNotificationAction = (type: string) => {
    if (type === 'chat') {
      setActiveTab('messages');
      setShowNotifications(false);
    } else if (type === 'feed') {
      setActiveTab('feed');
      setShowNotifications(false);
    } else if (type === 'profile') {
      setActiveTab('profile');
      setShowNotifications(false);
    }
  };

  const renderContent = () => {
    if (showNotifications) {
      return (
        <NotificationsPage 
          onClose={() => setShowNotifications(false)} 
          onProfileClick={handleProfileClick}
          onAction={handleNotificationAction}
        />
      );
    }

    switch (activeTab) {
      case 'groups':
        return <GroupsPage onProfileClick={handleProfileClick} />;
      case 'messages':
        return <ChatList onProfileClick={handleProfileClick} />;
      case 'profile':
        return <ProfilePage userId={user.uid} onProfileClick={handleProfileClick} />;
      case 'add':
      case 'feed':
      default:
        return <Feed onProfileClick={handleProfileClick} />;
    }
  };

  return (
    <div className="app-container flex flex-col h-screen overflow-hidden">
      {!showNotifications && (
        <Header onNotificationClick={() => setShowNotifications(true)} />
      )}
      
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {renderContent()}
      </div>

      {activeTab === 'add' && (
        <CreatePost onClose={() => setActiveTab('feed')} />
      )}

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        setShowNotifications(false);
        setActiveTab(tab);
        setViewingUserId(null);
      }} />

      {viewingUserId && (
        <div className="fixed inset-0 z-[100] bg-background md:bg-black/60 flex justify-center items-center animate-in fade-in duration-300">
          <div className="w-full h-full md:max-w-2xl lg:max-w-3xl md:h-[92vh] md:rounded-[3rem] overflow-hidden shadow-2xl relative bg-white">
            <ProfilePage 
              userId={viewingUserId} 
              onBack={() => setViewingUserId(null)} 
              onProfileClick={handleProfileClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}
