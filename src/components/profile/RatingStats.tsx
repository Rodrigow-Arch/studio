"use client";

import { Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RatingStatsProps {
  profile: any;
}

export default function RatingStats({ profile }: RatingStatsProps) {
  if (!profile) return null;

  if (profile.totalRatings === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center space-y-2 bg-secondary/10 rounded-2xl border border-dashed">
        <Star className="w-8 h-8 text-muted" />
        <p className="text-sm font-medium">Ainda sem avaliações.</p>
        <p className="text-xs text-muted-foreground">Começa a ajudar para seres avaliado! 🤝</p>
      </div>
    );
  }

  const distribution = [
    { stars: 5, percent: 100, count: profile.totalRatings },
    { stars: 4, percent: 0, count: 0 },
    { stars: 3, percent: 0, count: 0 },
    { stars: 2, percent: 0, count: 0 },
    { stars: 1, percent: 0, count: 0 },
  ];

  return (
    <div className="space-y-4 bg-white p-4 rounded-2xl border">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <span className="text-4xl font-headline text-primary">{profile.averageRating.toFixed(1)}</span>
          <div className="flex text-yellow-400">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Math.round(profile.averageRating) ? 'fill-current' : ''}`} />)}
          </div>
          <span className="text-[10px] text-muted-foreground">{profile.totalRatings} avaliações</span>
        </div>

        <div className="flex-1 space-y-1">
          {distribution.map(d => (
            <div key={d.stars} className="flex items-center gap-2">
              <span className="text-[10px] w-3">{d.stars}</span>
              <Progress value={d.percent} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground w-6">{d.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
