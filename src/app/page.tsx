
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
import { doc } from 'firebase/firestore';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const [activeTab, setActiveTab] = React.useState('feed');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [viewingUserId, setViewingUserId] = React.useState<string | null>(null);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex flex-col shadow-xl border border-black/5">
            <div className="flex-[2] bg-[#055a36] flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
            <div className="h-[2px] bg-[#fcd116]" />
            <div className="flex-1 bg-[#ce1126] flex items-center justify-center">
              <span className="text-white font-headline text-[10px] font-black tracking-tight">PU</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">A carregar o teu mundo...</p>
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

  const handleNotificationAction = (type: string, data?: any) => {
    if (type === 'chat') {
      setActiveTab('messages');
      setShowNotifications(false);
    } else if (type === 'feed') {
      setActiveTab('feed');
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
        return <ProfilePage userId={user.uid} />;
      case 'add':
      case 'feed':
      default:
        return <Feed key="feed-tab-feed" onProfileClick={handleProfileClick} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {!showNotifications && <Header onNotificationClick={() => setShowNotifications(true)} />}
      
      <div className="flex-1 overflow-y-auto pb-24">
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

      {/* Overlay de Perfil: Permite ver o perfil sem desmontar o fundo (ex: lista de membros do grupo) */}
      {viewingUserId && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
          <ProfilePage 
            userId={viewingUserId} 
            onBack={() => setViewingUserId(null)} 
          />
        </div>
      )}
    </div>
  );
}
