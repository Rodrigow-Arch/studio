
"use client";

import * as React from 'react';
import AuthFlow from '@/components/auth/AuthFlow';
import BottomNav from '@/components/layout/BottomNav';
import Feed from '@/components/feed/Feed';
import ProfilePage from '@/components/profile/ProfilePage';
import GroupsPage from '@/components/groups/GroupsPage';
import ChatList from '@/components/chat/ChatList';
import NotificationsPage from '@/components/notifications/NotificationsPage';
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
          <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center">
            <span className="text-white font-headline text-2xl">P</span>
          </div>
          <p className="text-sm text-muted-foreground">A carregar o teu perfil...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthFlow />;
  }

  const handleProfileClick = (uid: string) => {
    setViewingUserId(uid);
    setShowNotifications(false);
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
    if (viewingUserId) {
      return (
        <ProfilePage 
          userId={viewingUserId} 
          onBack={() => setViewingUserId(null)} 
        />
      );
    }

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
        return <GroupsPage />;
      case 'add':
        // Adicionamos uma key para forçar o re-mount do componente Feed e abrir o formulário
        return <Feed key="add-tab-feed" initialShowCreate={true} onCreated={() => setActiveTab('feed')} onProfileClick={handleProfileClick} />;
      case 'messages':
        return <ChatList onProfileClick={handleProfileClick} />;
      case 'profile':
        return <ProfilePage userId={user.uid} />;
      case 'feed':
      default:
        return <Feed key="feed-tab-feed" onProfileClick={handleProfileClick} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {!viewingUserId && <Header onNotificationClick={() => setShowNotifications(true)} />}
      
      <div className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </div>

      {!viewingUserId && (
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          setShowNotifications(false);
          setActiveTab(tab);
          setViewingUserId(null);
        }} />
      )}
    </div>
  );
}
