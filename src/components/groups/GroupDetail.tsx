
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Hash, 
  Share2, 
  LayoutGrid, 
  MessageSquare, 
  Trash2, 
  Send,
  User,
  UserMinus 
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, deleteDoc, where, addDoc, limit, updateDoc, arrayRemove, increment } from "firebase/firestore";
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
import { getTrustLevel } from '@/lib/trust-levels';
import { format, isToday, isYesterday, isSameDay, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { filterProfanity, isUserOnline } from '@/lib/utils';

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
  const [chatText, setChatText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  const messagesQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
  }, [db, groupId]);

  const { data: messages } = useCollection(messagesQuery);

  React.useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendMessage = async () => {
    if (!chatText.trim() || !user || !group) return;

    const cleanMsg = filterProfanity(chatText);
    
    const currentUserProfile = memberProfiles?.find(p => p.id === user.uid);
    setChatText('');

    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        text: cleanMsg,
        authorId: user.uid,
        authorUsername: currentUserProfile?.username || user.email?.split('@')[0] || 'Vizinho',
        authorAvatarLetter: currentUserProfile?.avatarLetter || user.email?.charAt(0).toUpperCase() || 'V',
        authorAvatarColor: currentUserProfile?.avatarColor || '#14532d',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar mensagem" });
    }
  };

  const renderDateSeparator = (currentMsg: any, prevMsg: any) => {
    const currentDate = new Date(currentMsg.timestamp);
    if (!prevMsg || !isSameDay(new Date(prevMsg.timestamp), currentDate)) {
      let dateLabel = '';
      if (isToday(currentDate)) {
        dateLabel = `Hoje, ${format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: pt })}`;
      } else if (isYesterday(currentDate)) {
        dateLabel = 'Ontem';
      } else if (differenceInDays(new Date(), currentDate) < 7) {
        dateLabel = format(currentDate, 'EEEE', { locale: pt });
      } else {
        dateLabel = format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: pt });
      }

      return (
        <div className="flex justify-center my-4 sticky top-0 z-10 pointer-events-none">
          <span className="text-[9px] bg-white/90 backdrop-blur-sm border shadow-sm px-3 py-1 rounded-full text-muted-foreground font-black uppercase tracking-widest pointer-events-auto">
            {dateLabel}
          </span>
        </div>
      );
    }
    return null;
  };

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

  const handleRemoveMember = async (memberId: string) => {
    if (!group || group.adminId !== user?.uid || memberId === user?.uid) return;

    try {
      await updateDoc(groupRef, {
        memberIds: arrayRemove(memberId)
      });
      
      await updateDoc(doc(db, 'users', memberId), {
        groupsJoined: increment(-1)
      });

      await addDoc(collection(db, 'users', memberId, 'notifications'), {
        userId: memberId,
        type: 'System',
        message: `Foste removido do grupo "${group.name}".`,
        isRead: false,
        timestamp: new Date().toISOString()
      });

      toast({ title: "Membro removido", description: "O utilizador foi removido do grupo." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao remover membro" });
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
    <div className="flex flex-col h-screen bg-background animate-in slide-in-from-right duration-300 overflow-hidden">
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="font-headline text-lg text-primary leading-tight truncate">{group?.name}</h2>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tighter truncate">
              <Hash className="w-3 h-3" /> {group?.type} • {group?.memberIds?.length || 0} membros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
                <AlertDialogFooter className="flex-row gap-2 mt-2">
                  <AlertDialogCancel className="flex-1 rounded-xl mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup} className="flex-1 bg-destructive hover:bg-destructive/90 rounded-xl mt-0">
                    Apagar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <div className="px-4 pt-4 shrink-0">
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
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'tasks' && (
          <div className="p-4 space-y-4 overflow-y-auto">
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
          <div className="flex-1 flex flex-col overflow-hidden bg-secondary/5">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((msg, idx) => {
                const isMe = msg.authorId === user?.uid;
                const authorProfile = memberProfiles?.find(p => p.id === msg.authorId);
                const trustLevel = authorProfile ? getTrustLevel(authorProfile.points || 0) : null;
                
                return (
                  <React.Fragment key={msg.id}>
                    {renderDateSeparator(msg, idx > 0 ? messages[idx - 1] : null)}
                    <div className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar 
                        className="w-8 h-8 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onProfileClick(msg.authorId)}
                      >
                        {authorProfile?.photoUrl && <AvatarImage src={authorProfile.photoUrl} className="object-cover" />}
                        <AvatarFallback className="text-white text-[10px] font-bold" style={{ backgroundColor: msg.authorAvatarColor }}>
                          {msg.authorAvatarLetter}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1 mb-1 px-1">
                          <span className="text-[10px] font-bold text-muted-foreground">{msg.authorUsername}</span>
                          {trustLevel && <span className="text-[10px]">{trustLevel.icon}</span>}
                        </div>
                        <div className={`p-2.5 rounded-2xl text-sm shadow-sm border ${
                          isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-foreground rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        <p className="text-[8px] mt-1 text-muted-foreground px-1">
                          {format(new Date(msg.timestamp), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              
              {(!messages || messages.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-30">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-xs font-bold uppercase tracking-widest">Início da conversa do grupo</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-white flex items-center gap-2 shrink-0">
              <Input 
                placeholder="Escreve no grupo..." 
                value={chatText} 
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                className="rounded-full bg-secondary/50 border-none h-10 text-sm"
              />
              <Button size="icon" className="rounded-full shrink-0 h-10 w-10" onClick={handleSendMessage} disabled={!chatText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h3 className="font-headline text-md">Lista de Membros</h3>
            {membersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-secondary/20 animate-pulse rounded-2xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {memberProfiles?.map(profile => {
                  const trustLevel = getTrustLevel(profile.points || 0);
                  const isOnline = isUserOnline(profile.lastActive);
                  const isThisUserAdmin = profile.id === group?.adminId;
                  
                  return (
                    <div 
                      key={profile.id} 
                      className="flex items-center justify-between p-3 bg-white border rounded-2xl cursor-pointer hover:bg-secondary/10 transition-colors"
                      onClick={() => onProfileClick(profile.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 border">
                            {profile.photoUrl && <AvatarImage src={profile.photoUrl} className="object-cover" />}
                            <AvatarFallback className="text-white font-bold" style={{ backgroundColor: profile.avatarColor }}>
                              {profile.avatarLetter}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-bold leading-none">{profile.fullName}</p>
                            {trustLevel && <span title={trustLevel.label}>{trustLevel.icon}</span>}
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {profile.username} • 
                            <span className={isOnline ? 'text-green-600 font-bold' : ''}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          {isThisUserAdmin && (
                            <Badge variant="secondary" className="text-[8px] uppercase tracking-widest bg-primary/10 text-primary border-none">Admin</Badge>
                          )}
                          {trustLevel && (
                            <span className={`text-[8px] font-black uppercase ${trustLevel.color}`}>{trustLevel.label}</span>
                          )}
                        </div>
                        
                        {isAdmin && !isThisUserAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-primary hover:text-white transition-all rounded-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl max-w-[320px]" onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Membro?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Tens a certeza que queres remover {profile.fullName} deste grupo?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row gap-2 mt-2">
                                <AlertDialogCancel className="flex-1 rounded-xl mt-0">Não</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveMember(profile.id)} 
                                  className="flex-1 bg-destructive hover:bg-destructive/90 rounded-xl mt-0"
                                >
                                  Sim, Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  );
                })}
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
