"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Hash, 
  Share2, 
  LayoutGrid, 
  MessageSquare, 
  Trash2, 
  Settings,
  User 
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, deleteDoc, where } from "firebase/firestore";
import PostCard from '../feed/PostCard';
import CreatePost from '../feed/CreatePost';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  onProfileClick: (uid: string) => void;
}

export default function GroupDetail({ groupId, onBack, onProfileClick }: GroupDetailProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'chat' | 'members'>('tasks');

  const groupRef = useMemoFirebase(() => doc(db, 'groups', groupId), [db, groupId]);
  const { data: group, isLoading: groupLoading } = useDoc(groupRef);

  const tasksQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'posts'),
      orderBy('timestamp', 'desc')
    );
  }, [db]);

  const { data: allPosts, isLoading: tasksLoading } = useCollection(tasksQuery);

  const groupTasks = React.useMemo(() => {
    if (!allPosts) return [];
    return allPosts.filter(p => p.groupId === groupId);
  }, [allPosts, groupId]);

  const membersQuery = useMemoFirebase(() => {
    if (!group?.memberIds || group.memberIds.length === 0) return null;
    return query(
      collection(db, 'users'),
      where('id', 'in', group.memberIds.slice(0, 30))
    );
  }, [db, group?.memberIds]);

  const { data: memberProfiles, isLoading: membersLoading } = useCollection(membersQuery);

  const copyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast({ title: "Código copiado!", description: "Partilha com os teus convidados." });
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || group.adminId !== user?.uid) return;
    
    try {
      await deleteDoc(groupRef);
      toast({ title: "Grupo removido", description: "O grupo foi apagado com sucesso." });
      onBack();
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao apagar", description: "Não foi possível apagar o grupo." });
    }
  };

  if (groupLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = group?.adminId === user?.uid;

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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={copyInviteCode} className="rounded-full h-8 w-8">
            <Share2 className="w-4 h-4" />
          </Button>
          
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl max-w-[320px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Apagar Grupo?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    Esta ação é irreversível. Todas as tarefas e dados deste grupo serão perdidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-2">
                  <AlertDialogCancel className="flex-1 rounded-xl">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} className="flex-1 bg-destructive hover:bg-destructive/90 rounded-xl">
                    Apagar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div className="flex bg-secondary/30 p-1 rounded-2xl">
          <button 
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('tasks')}
          >
            <LayoutGrid className="w-3 h-3" /> Tarefas
          </button>
          <button 
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare className="w-3 h-3" /> Chat
          </button>
          <button 
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'members' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('members')}
          >
            <Users className="w-3 h-3" /> Membros
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
            ) : groupTasks.length === 0 ? (
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
                {groupTasks.map(task => (
                  <PostCard key={task.id} post={task} onProfileClick={onProfileClick} />
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

        {activeTab === 'members' && (
          <div className="space-y-4">
            <h3 className="font-headline text-md">Lista de Membros</h3>
            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary/20 animate-pulse rounded-2xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {memberProfiles?.map(profile => (
                  <div 
                    key={profile.id} 
                    className="flex items-center justify-between p-3 bg-white border rounded-2xl cursor-pointer hover:bg-secondary/10 transition-colors"
                    onClick={() => onProfileClick(profile.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        {profile.photoUrl && <AvatarImage src={profile.photoUrl} className="object-cover" />}
                        <AvatarFallback className="text-white font-bold" style={{ backgroundColor: profile.avatarColor }}>
                          {profile.avatarLetter}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold leading-none">{profile.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{profile.username}</p>
                      </div>
                    </div>
                    {profile.id === group?.adminId && (
                      <Badge variant="secondary" className="text-[8px] uppercase tracking-widest bg-primary/10 text-primary border-none">Admin</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center text-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <p className="text-[10px] font-bold uppercase text-primary">Convida mais pessoas</p>
              <p className="text-[9px] text-muted-foreground">Partilha o código: <span className="font-mono font-bold text-foreground">{group?.inviteCode}</span></p>
              <Button size="sm" variant="outline" className="h-7 text-[9px] mt-1" onClick={copyInviteCode}>Copiar Código</Button>
            </div>
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