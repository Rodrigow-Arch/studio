
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Plus, Users, Hash, Share2, Info, LayoutGrid, MessageSquare } from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import PostCard from '../feed/PostCard';
import CreatePost from '../feed/CreatePost';
import { useToast } from "@/hooks/use-toast";

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
}

export default function GroupDetail({ groupId, onBack }: GroupDetailProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'chat'>('tasks');

  const groupRef = useMemoFirebase(() => doc(db, 'groups', groupId), [db, groupId]);
  const { data: group, isLoading: groupLoading } = useDoc(groupRef);

  const tasksQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'posts'),
      where('groupId', '==', groupId),
      orderBy('timestamp', 'desc')
    );
  }, [db, groupId]);

  const { data: tasks, isLoading: tasksLoading } = useCollection(tasksQuery);

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast({ title: "Código copiado!", description: "Partilha com os teus convidados." });
    }
  };

  if (groupLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background animate-in slide-in-from-right duration-300">
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-headline text-lg text-primary leading-tight">{group?.name}</h2>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tighter">
              <Hash className="w-3 h-3" /> {group?.type} • {group?.memberIds?.length || 0} membros
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={copyInviteCode} className="rounded-full">
          <Share2 className="w-5 h-5" />
        </Button>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex bg-secondary/30 p-1 rounded-2xl">
          <button 
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('tasks')}
          >
            <LayoutGrid className="w-4 h-4" /> Tarefas
          </button>
          <button 
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        </div>

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-md">Tarefas do Grupo</h3>
              <Button size="sm" onClick={() => setShowCreatePost(true)} className="h-8 text-[11px] rounded-full">
                <Plus className="w-4 h-4 mr-1" /> Nova Tarefa
              </Button>
            </div>

            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-32 bg-secondary/20 animate-pulse rounded-2xl" />)}
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-3xl border shadow-sm">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center text-2xl">📋</div>
                <div className="space-y-1 px-8">
                  <p className="font-bold text-sm">Sem tarefas ativas</p>
                  <p className="text-xs text-muted-foreground">Adiciona uma tarefa para que os membros do grupo possam ajudar.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCreatePost(true)}>Adicionar Tarefa</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <PostCard key={task.id} post={task} onProfileClick={(uid) => console.log('Profile click', uid)} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-50">
            <MessageSquare className="w-12 h-12 text-muted" />
            <p className="text-sm font-bold">Chat de Grupo em breve!</p>
            <p className="text-xs">Usa as tarefas para interagir por agora.</p>
          </div>
        )}
      </div>

      {showCreatePost && (
        <CreatePost 
          onClose={() => setShowCreatePost(false)} 
          groupId={groupId}
        />
      )}
    </div>
  );
}
