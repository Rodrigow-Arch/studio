"use client";

import * as React from 'react';
import { useStore, store } from '@/lib/store';
import AuthFlow from '@/components/auth/AuthFlow';
import BottomNav from '@/components/layout/BottomNav';
import Feed from '@/components/feed/Feed';
import ProfilePage from '@/components/profile/ProfilePage';
import GroupsPage from '@/components/groups/GroupsPage';
import ChatList from '@/components/chat/ChatList';
import NotificationsPage from '@/components/notifications/NotificationsPage';
import { Header } from '@/components/layout/Header';

export default function Home() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = React.useState('feed');
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Simple loading state to avoid flash
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!currentUser) {
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