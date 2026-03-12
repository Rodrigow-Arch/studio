
"use client";

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, HandHeart, CheckCircle2, Clock, MapPin, Send, Euro, Wallet } from "lucide-react";
import { calculateDistance } from "@/lib/geo";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { doc, collection, addDoc, query, orderBy, limit, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function PostCard({ post, onProfileClick }: { post: any, onProfileClick: (uid: string) => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [isApplying, setIsApplying] = React.useState(false);

  const currentUserDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: currentUserProfile } = useDoc(currentUserDocRef);

  const commentsQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'posts', post.id, 'comments'),
      orderBy('timestamp', 'asc'),
      limit(20)
    );
  }, [db, post.id]);

  const { data: comments } = useCollection(commentsQuery);

  const distance = (currentUserProfile && post.latitude && post.longitude)
    ? calculateDistance(currentUserProfile.latitude, currentUserProfile.longitude, post.latitude, post.longitude).toFixed(1)
    : '??';

  const typeColors: Record<string, string> = {
    'Ajuda': 'bg-blue-100 text-blue-700 border-blue-200',
    'SOS': 'bg-red-100 text-red-700 border-red-200 animate-pulse',
    'Partilha': 'bg-green-100 text-green-700 border-green-200',
    'Evento': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const handleAddComment = async () => {
    if (!commentText || !user || !currentUserProfile) return;
    
    const newComment = {
      postId: post.id,
      text: commentText,
      authorId: user.uid,
      authorUsername: currentUserProfile.username,
      authorAvatarLetter: currentUserProfile.avatarLetter,
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), newComment);
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });
      setCommentText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyToHelp = async () => {
    if (!user || !currentUserProfile || isApplying) return;
    setIsApplying(true);

    try {
      // 1. Criar a candidatura
      const applicationData = {
        postId: post.id,
        postAuthorId: post.authorId,
        applicantId: user.uid,
        applicantUsername: currentUserProfile.username,
        applicantZone: currentUserProfile.zone,
        applicantAverageRating: currentUserProfile.averageRating,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      await addDoc(collection(db, 'posts', post.id, 'applications'), applicationData);
      
      // 2. Incrementar contador no post
      await updateDoc(doc(db, 'posts', post.id), {
        candidateCount: increment(1)
      });

      // 3. Enviar notificação para o autor do post
      const notificationData = {
        userId: post.authorId,
        type: 'application',
        message: `${currentUserProfile.username} quer ajudar-te no post: "${post.text.substring(0, 30)}..."`,
        postId: post.id,
        applicantId: user.uid,
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

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 flex flex-row items-center gap-3">
        <div 
          className="flex flex-row items-center gap-3 cursor-pointer group"
          onClick={() => onProfileClick(post.authorId)}
        >
          <Avatar className="w-10 h-10 transition-transform group-hover:scale-105" style={{ backgroundColor: post.authorAvatarColor }}>
            <AvatarFallback className="bg-transparent text-white font-bold">{post.authorAvatarLetter}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate group-hover:text-primary transition-colors">{post.authorUsername}</span>
              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 font-normal ${typeColors[post.type] || ''}`}>
                {post.type}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {post.zone}, {distance}km</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: pt }) : ''}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2 space-y-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
        
        {/* Exibição da Recompensa (apenas se existir) */}
        {post.paymentAmount > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 p-2.5 rounded-xl w-fit animate-in zoom-in-95">
            <Wallet className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-primary uppercase leading-tight">Recompensa: {post.paymentAmount}€</span>
              <span className="text-[9px] text-muted-foreground font-medium uppercase">{post.paymentMethod}</span>
            </div>
          </div>
        )}

        {post.status !== 'aberto' && (
           <div className="mt-1 flex items-center gap-2 text-xs font-medium px-2 py-1 bg-secondary rounded-lg w-fit">
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
              className="h-8 text-[11px] gap-1.5 px-2"
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
              className="h-8 px-3 text-[11px] font-bold rounded-full bg-accent hover:bg-accent/90"
              onClick={handleApplyToHelp}
              disabled={isApplying}
            >
              <HandHeart className="w-4 h-4 mr-1.5" /> {isApplying ? "A enviar..." : "Quero Ajudar"}
            </Button>
          )}
        </div>

        {showComments && (
          <div className="w-full pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-3">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar 
                    className="w-6 h-6 shrink-0 cursor-pointer" 
                    onClick={() => onProfileClick(comment.authorId)}
                  >
                    <AvatarFallback className="text-[10px] bg-secondary">{comment.authorAvatarLetter}</AvatarFallback>
                  </Avatar>
                  <div className="bg-white/50 p-2 rounded-2xl flex-1 text-xs">
                    <span 
                      className="font-bold mr-1 cursor-pointer hover:underline"
                      onClick={() => onProfileClick(comment.authorId)}
                    >
                      {comment.authorUsername}
                    </span>
                    {comment.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 items-center">
              <Input 
                placeholder="Escreve um comentário..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="h-8 text-xs bg-white/50 rounded-full"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={handleAddComment} disabled={!commentText}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
