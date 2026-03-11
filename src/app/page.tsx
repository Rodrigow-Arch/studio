"use client";

import * as React from 'react';
import { useStore } from '@/lib/store';
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

  const renderContent = () => {
    if (showNotifications) return <NotificationsPage onClose={() => setShowNotifications(false)} />;

    switch (activeTab) {
      case 'groups':
        return <GroupsPage />;
      case 'add':
        return <Feed initialShowCreate={true} onCreated={() => setActiveTab('feed')} />;
      case 'messages':
        return <ChatList />;
      case 'profile':
        return <ProfilePage />;
      case 'feed':
      default:
        return <Feed />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header onNotificationClick={() => setShowNotifications(true)} />
      
      <div className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        setShowNotifications(false);
        setActiveTab(tab);
      }} />
    </div>
  );
}
