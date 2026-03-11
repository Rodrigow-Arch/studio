
"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, HandHeart, CheckCircle2, Clock, MapPin } from "lucide-react";
import { calculateDistance } from "@/lib/geo";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export default function PostCard({ post }: { post: any }) {
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    return user ? doc(db, 'users', user.uid) : null;
  }, [db, user]);

  const { data: currentUserProfile } = useDoc(userDocRef);

  const distance = (currentUserProfile && post.latitude && post.longitude)
    ? calculateDistance(currentUserProfile.latitude, currentUserProfile.longitude, post.latitude, post.longitude).toFixed(1)
    : '??';

  const typeColors: Record<string, string> = {
    'Ajuda': 'bg-blue-100 text-blue-700 border-blue-200',
    'SOS': 'bg-red-100 text-red-700 border-red-200 animate-pulse',
    'Partilha': 'bg-green-100 text-green-700 border-green-200',
    'Evento': 'bg-purple-100 text-purple-700 border-purple-200'
  };

  const handleHelp = () => {
    alert('Candidatura enviada! O autor será notificado.');
  };

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-4 flex flex-row items-center gap-3">
        <Avatar className="w-10 h-10" style={{ backgroundColor: post.authorAvatarColor }}>
          <AvatarFallback className="bg-transparent text-white font-bold">{post.authorAvatarLetter}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate">{post.authorUsername}</span>
            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 font-normal ${typeColors[post.type] || ''}`}>
              {post.type}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {post.zone}, {distance}km</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: pt }) : ''}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
        
        {post.status !== 'aberto' && (
           <div className="mt-3 flex items-center gap-2 text-xs font-medium px-2 py-1 bg-secondary rounded-lg w-fit">
              {post.status === 'em curso' ? '🟡 Em curso' : '✅ Resolvido'}
           </div>
        )}
      </CardContent>

      <CardFooter className="p-2 bg-muted/30 flex items-center justify-between border-t border-muted/50">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1.5 px-2">
            <MessageSquare className="w-4 h-4" /> {post.commentCount || 0}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1.5 px-2">
            <CheckCircle2 className="w-4 h-4" /> {post.candidateCount || 0} candidatos
          </Button>
        </div>

        {post.authorId !== user?.uid && post.status === 'aberto' && (
          <Button size="sm" variant="default" className="h-8 px-3 text-[11px] font-bold rounded-full bg-accent hover:bg-accent/90" onClick={handleHelp}>
            <HandHeart className="w-4 h-4 mr-1.5" /> Quero Ajudar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
