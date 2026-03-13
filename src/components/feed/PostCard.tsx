"use client";

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, HandHeart, CheckCircle2, Clock, MapPin, Send, 
  Wallet, ShieldCheck, Lock, Zap, 
  ChevronDown, ChevronUp, BadgeCheck, MoreVertical, Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, query, orderBy, limit, updateDoc, increment, writeBatch, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { checkAndAwardBadges } from '@/lib/badge-logic';
import { getTrustLevel } from '@/lib/trust-levels';
import SOSRequirementModal from '../security/SOSRequirementModal';
import { filterProfanity } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PostCard({ post, onProfileClick }: { post: any, onProfileClick: (uid: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [showComments, setShowComments] = React.useState(false);
  const [showAllComments, setShowAllComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);
  const [isSOSModalOpen, setIsSOSModalOpen] = React.useState(false);
  
  // Estados para Eliminação
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const currentUserDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: currentUserProfile } = useDoc(currentUserDocRef);

  const authorDocRef = useMemoFirebase(() => {
    return post.authorId ? doc(db, 'users', post.authorId) : null;
  }, [db, post.authorId]);

  const { data: authorProfile } = useDoc(authorDocRef);

  const commentsQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'posts', post.id, 'comments'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [db, post.id]);

  const { data: comments } = useCollection(commentsQuery);

  const typeColors: Record<string, string> = {
    'Ajuda': 'bg-blue-100 text-blue-700 border-blue-200',
    'SOS': 'bg-red-100 text-red-700 border-red-200',
    'Partilha': 'bg-green-100 text-green-700 border-green-200',
    'Evento': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const isAuthor = post.authorId === user?.uid;

  const hasAccess = post.type === 'SOS' && currentUserProfile 
    ? (currentUserProfile.points || 0) >= 500 
    : true;

  const handleAddComment = async () => {
    if (!commentText || !user || !currentUserProfile) return;
    
    const cleanComment = filterProfanity(commentText);

    const newComment = {
      postId: post.id,
      text: cleanComment,
      authorId: user.uid,
      authorUsername: currentUserProfile.username,
      authorAvatarLetter: currentUserProfile.avatarLetter,
      authorAvatarColor: currentUserProfile.avatarColor,
      authorPoints: currentUserProfile.points || 0,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), newComment);
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });
      await updateDoc(doc(db, 'users', user.uid), {
        commentsMade: increment(1)
      });
      await checkAndAwardBadges(db, user.uid);
      setCommentText('');
      setShowAllComments(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyToHelp = async () => {
    if (!user || !currentUserProfile || isApplying) return;

    if (!hasAccess) {
      setIsSOSModalOpen(true);
      return;
    }

    setIsApplying(true);

    try {
      const applicationData = {
        postId: post.id,
        postAuthorId: post.authorId,
        applicantId: user.uid,
        applicantUsername: currentUserProfile.username,
        applicantZone: currentUserProfile.zone,
        applicantAverageRating: currentUserProfile.averageRating,
        applicantPoints: currentUserProfile.points || 0,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      await addDoc(collection(db, 'posts', post.id, 'applications'), applicationData);
      
      await updateDoc(doc(db, 'posts', post.id), {
        candidateCount: increment(1)
      });

      const notificationData = {
        userId: post.authorId,
        type: 'application',
        message: `${currentUserProfile.username} quer ajudar-te no post: "${post.text.substring(0, 30)}..."`,
        postId: post.id,
        applicantId: user.uid,
        applicantUsername: currentUserProfile.username,
        applicantPoints: currentUserProfile.points || 0,
        isRead: false,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'users', post.authorId, 'notifications'), notificationData);

      toast({
        title: "Candidatura enviada!",
        description: "O autor do post foi notificado.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao candidatar",
        description: "Não foi possível enviar a tua candidatura."
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleDelete = async () => {
    if (!user || isUpdating) return;
    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      
      batch.delete(doc(db, 'posts', post.id));

      const commentsSnap = await getDocs(collection(db, 'posts', post.id, 'comments'));
      commentsSnap.forEach(d => batch.delete(d.ref));

      const applicationsSnap = await getDocs(collection(db, 'posts', post.id, 'applications'));
      applicationsSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      toast({ title: "Publicação eliminada." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao eliminar publicação" });
    } finally {
      setIsUpdating(false);
      setIsDeleting(false);
    }
  };

  const trustLevel = getTrustLevel(authorProfile?.points || 0);

  const visibleComments = React.useMemo(() => {
    if (!comments) return [];
    return showAllComments ? comments : comments.slice(0, 3);
  }, [comments, showAllComments]);

  return (
    <>
      <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] bg-white rounded-3xl animate-in fade-in zoom-in-95">
        <CardHeader className="p-4 flex flex-row items-center justify-between gap-2">
          <div 
            className="flex flex-row items-center gap-2 min-w-0 flex-1 cursor-pointer group"
            onClick={() => onProfileClick(post.authorId)}
          >
            <Avatar className="w-9 h-9 shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm">
              {authorProfile?.photoUrl && <AvatarImage src={authorProfile.photoUrl} className="object-cover" />}
              <AvatarFallback className="text-white font-bold" style={{ backgroundColor: post.authorAvatarColor }}>
                {post.authorAvatarLetter}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-xs truncate max-w-[120px] group-hover:text-primary transition-colors">{post.authorUsername}</span>
                {post.authorUsername === '@faroltech' && (
                  <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6] shrink-0" />
                )}
                {trustLevel && (
                  <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full ${trustLevel.bg} border border-current/10 ${trustLevel.color} text-[7px] font-black uppercase shrink-0`}>
                    {trustLevel.icon} {trustLevel.label}
                  </div>
                )}
                <Badge variant="outline" className={`text-[9px] py-0 px-1 h-3.5 font-normal shrink-0 ${typeColors[post.type] || ''}`}>
                  {post.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5 truncate"><MapPin className="w-2.5 h-2.5" /> {post.zone}</span>
                <span className="flex items-center gap-0.5 shrink-0"><Clock className="w-2.5 h-2.5" /> {post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: pt }) : ''}</span>
              </div>
            </div>
          </div>

          {isAuthor && post.status === 'aberto' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl min-w-[140px]">
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsDeleting(true);
                  }}
                  className="gap-2 text-xs font-bold py-2.5 text-destructive cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        
        <CardContent className="px-4 py-2 space-y-3">
          {post.type === 'SOS' && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={`text-[9px] font-black h-5 uppercase tracking-wider gap-1 ${hasAccess ? 'bg-primary text-white' : 'bg-destructive text-white animate-pulse'}`}>
                <Zap className="w-3 h-3" /> SOS URGENTE
              </Badge>
              <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                {hasAccess ? <ShieldCheck className="w-3 h-3 text-primary" /> : <Lock className="w-3 h-3" />}
                🛡️ Requer selo Prata ou superior para ajudar
              </span>
            </div>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
          
          {post.paymentAmount > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 p-2.5 rounded-2xl w-fit animate-in zoom-in-95 duration-500">
              <Wallet className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-primary uppercase leading-tight">Recompensa: {post.paymentAmount}€</span>
                <span className="text-[9px] text-muted-foreground font-medium uppercase">{post.paymentMethod}</span>
              </div>
            </div>
          )}

          {post.status !== 'aberto' && (
             <div className="mt-1 flex items-center gap-2 text-xs font-medium px-2 py-1 bg-secondary rounded-lg w-fit animate-pulse">
                {post.status === 'em curso' ? '🟡 Em curso' : '✅ Resolvido'}
             </div>
          )}
        </CardContent>

        <CardFooter className="p-2 bg-muted/30 flex flex-col border-t border-muted/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[11px] gap-1.5 px-2 hover:bg-white/50 rounded-full"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="w-4 h-4" /> {post.commentCount || 0}
              </Button>
              <div className="flex items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
                <CheckCircle2 className="w-4 h-4" /> {post.candidateCount || 0} candidatos
              </div>
            </div>

            {post.authorId !== user?.uid && post.status === 'aberto' && (
              <Button 
                size="sm" 
                variant="default" 
                className={`h-8 px-4 text-[11px] font-bold rounded-full shadow-sm active:scale-90 transition-transform ${
                  !hasAccess ? 'bg-secondary text-muted-foreground cursor-not-allowed border' :
                  post.type === 'SOS' ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-accent hover:bg-accent/90 text-white'
                }`}
                onClick={handleApplyToHelp}
                disabled={isApplying}
              >
                {!hasAccess ? <Lock className="w-4 h-4 mr-1.5" /> : 
                 post.type === 'SOS' ? <Zap className="w-4 h-4 mr-1.5" /> : <HandHeart className="w-4 h-4 mr-1.5" />}
                {isApplying ? "A enviar..." : (!hasAccess ? "Bloqueado" : (post.type === 'SOS' ? "Responder SOS" : "Quero Ajudar"))}
              </Button>
            )}
          </div>

          {showComments && (
            <div className="w-full pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <ScrollArea className="max-h-[300px] w-full pr-4">
                <div className="space-y-3">
                  {visibleComments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} onProfileClick={onProfileClick} />
                  ))}
                </div>
              </ScrollArea>
              
              {comments && comments.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-8 text-[10px] font-black uppercase text-primary hover:bg-primary/5 rounded-xl mt-1"
                  onClick={() => setShowAllComments(!showAllComments)}
                >
                  {showAllComments ? (
                    <><ChevronUp className="w-3.5 h-3.5 mr-1.5" /> Ver Menos</>
                  ) : (
                    <><ChevronDown className="w-3.5 h-3.5 mr-1.5" /> Ver todos os {comments.length} comentários</>
                  )}
                </Button>
              )}
              
              <div className="flex gap-2 items-center pb-2 px-1">
                <Input 
                  placeholder="Escreve um comentário..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="h-9 text-xs bg-white rounded-full border-none shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button size="icon" className="h-9 w-9 rounded-full shrink-0 shadow-md" onClick={handleAddComment} disabled={!commentText}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardFooter>

        {currentUserProfile && (
          <SOSRequirementModal 
            isOpen={isSOSModalOpen}
            onClose={() => setIsSOSModalOpen(false)}
            userProfile={currentUserProfile}
          />
        )}
      </Card>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="max-w-[340px] rounded-3xl z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Publicação?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Esta ação é irreversível. Todas as candidaturas e comentários associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-2">
            <AlertDialogCancel className="flex-1 rounded-xl mt-0">Não</AlertDialogCancel>
            <AlertDialogAction 
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-xl mt-0"
              onClick={handleDelete}
              disabled={isUpdating}
            >
              {isUpdating ? "A eliminar..." : "Sim, Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CommentItem({ comment, onProfileClick }: { comment: any, onProfileClick: (uid: string) => void }) {
  const db = useFirestore();
  const authorRef = useMemoFirebase(() => doc(db, 'users', comment.authorId), [db, comment.authorId]);
  const { data: authorProfile } = useDoc(authorRef);
  const trustLevel = getTrustLevel(authorProfile?.points || comment.authorPoints || 0);

  return (
    <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300 group">
      <Avatar 
        className="w-7 h-7 shrink-0 cursor-pointer hover:scale-110 transition-transform shadow-sm" 
        onClick={() => onProfileClick(comment.authorId)}
      >
        {authorProfile?.photoUrl && <AvatarImage src={authorProfile.photoUrl} className="object-cover" />}
        <AvatarFallback className="text-[10px] font-bold text-white" style={{ backgroundColor: comment.authorAvatarColor || '#e2e8f0' }}>
          {comment.authorAvatarLetter}
        </AvatarFallback>
      </Avatar>
      <div className="bg-white/80 p-2.5 rounded-2xl flex-1 text-xs shadow-sm border border-secondary/20 hover:border-primary/20 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1">
              <span 
                className="font-black cursor-pointer hover:text-primary transition-colors text-[10px]"
                onClick={() => onProfileClick(comment.authorId)}
              >
                {comment.authorUsername}
              </span>
              {comment.authorUsername === '@faroltech' && <BadgeCheck className="w-3.5 h-3.5 text-[#0095f6]" />}
            </div>
            {trustLevel && (
              <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full ${trustLevel.bg} border border-current/10 ${trustLevel.color} text-[6px] font-black uppercase`}>
                {trustLevel.icon} {trustLevel.label}
              </div>
            )}
          </div>
          <span className="text-[8px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: pt })}
          </span>
        </div>
        <p className="text-muted-foreground leading-snug">{comment.text}</p>
      </div>
    </div>
  );
}