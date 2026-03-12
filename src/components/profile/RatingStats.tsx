
"use client";

import * as React from 'react';
import { Star, Quote, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface RatingStatsProps {
  profile: any;
  onProfileClick?: (uid: string) => void;
}

export default function RatingStats({ profile, onProfileClick }: RatingStatsProps) {
  const db = useFirestore();
  const [showAllTestimonials, setShowAllTestimonials] = React.useState(false);

  const ratingsQuery = useMemoFirebase(() => {
    if (!profile?.id) return null;
    return query(
      collection(db, 'ratings'),
      where('ratedUserId', '==', profile.id),
      limit(20)
    );
  }, [db, profile?.id]);

  const { data: rawRatings, isLoading } = useCollection(ratingsQuery);

  const ratingComments = React.useMemo(() => {
    if (!rawRatings) return [];
    const sorted = [...rawRatings]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });
    
    return showAllTestimonials ? sorted : sorted.slice(0, 3);
  }, [rawRatings, showAllTestimonials]);

  if (!profile) return null;

  if (profile.totalRatings === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center space-y-3 bg-secondary/10 rounded-3xl border border-dashed border-primary/20">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Star className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold">Ainda sem avaliações</p>
          <p className="text-xs text-muted-foreground px-10 italic">Ajuda um vizinho para receberes o teu primeiro testemunho! 🤝</p>
        </div>
      </div>
    );
  }

  const distribution = [
    { stars: 5, count: profile.totalRatings },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className="text-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <span className="text-4xl font-headline text-primary block">{profile.averageRating.toFixed(1)}</span>
            <div className="flex text-yellow-400 justify-center my-1">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Math.round(profile.averageRating) ? 'fill-current' : ''}`} />)}
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{profile.totalRatings} avaliações</span>
          </div>

          <div className="flex-1 space-y-2">
            {distribution.map(d => {
              const percent = profile.totalRatings > 0 ? (d.count / profile.totalRatings) * 100 : 0;
              return (
                <div key={d.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-6">
                    <span className="text-[10px] font-black">{d.stars}</span>
                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                  </div>
                  <Progress value={percent} className="h-1.5 flex-1 bg-secondary/50" />
                  <span className="text-[10px] text-muted-foreground font-medium w-8 text-right">{Math.round(percent)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
              <Quote className="w-3 h-3" /> Testemunhos de Ajuda
            </h4>
            {rawRatings && rawRatings.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[9px] font-black uppercase text-primary hover:bg-primary/5"
                onClick={() => setShowAllTestimonials(!showAllTestimonials)}
              >
                {showAllTestimonials ? (
                  <><ChevronUp className="w-3 h-3 mr-1" /> Ver Menos</>
                ) : (
                  <><ChevronDown className="w-3 h-3 mr-1" /> Ver Mais ({rawRatings.length})</>
                )}
              </Button>
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-12 bg-secondary/20 animate-pulse rounded-xl" />
              <div className="h-12 bg-secondary/20 animate-pulse rounded-xl" />
            </div>
          ) : ratingComments && ratingComments.length > 0 ? (
            <div className="space-y-3 animate-in fade-in duration-500">
              {ratingComments.map((rc: any) => (
                <div key={rc.id} className="bg-secondary/10 p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-all flex gap-3">
                  <Avatar 
                    className="w-8 h-8 shrink-0 cursor-pointer hover:scale-110 transition-transform border border-white shadow-sm"
                    onClick={() => rc.raterId && onProfileClick?.(rc.raterId)}
                  >
                    <AvatarFallback className="text-[10px] font-bold bg-primary text-white">
                      {rc.raterUsername?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span 
                        className="text-[10px] font-bold text-primary cursor-pointer hover:underline"
                        onClick={() => rc.raterId && onProfileClick?.(rc.raterId)}
                      >
                        @{rc.raterUsername}
                      </span>
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-2 h-2 ${i <= rc.stars ? 'fill-current' : ''}`} />)}
                      </div>
                    </div>
                    <p className="text-xs italic text-muted-foreground leading-snug">"{rc.comment || 'Ajudou imenso, recomendo!'}"</p>
                    <p className="text-[8px] text-right mt-1 text-muted-foreground/60 uppercase font-black">
                      {formatDistanceToNow(new Date(rc.timestamp), { addSuffix: true, locale: pt })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic text-center py-2">Sem comentários detalhados ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
