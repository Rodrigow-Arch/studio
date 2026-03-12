"use client";

import * as React from 'react';
import { ALL_BADGES, Badge } from '@/lib/badges';
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Award } from 'lucide-react';

interface BadgeGridProps {
  earnedBadgeIds: string[];
}

export default function BadgeGrid({ earnedBadgeIds = [] }: BadgeGridProps) {
  const [showAll, setShowAll] = React.useState(false);

  const categories = Array.from(new Set(ALL_BADGES.map(b => b.category)));
  
  const visibleBadges = showAll ? ALL_BADGES : ALL_BADGES.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" /> As Minhas Insígnias
          {earnedBadgeIds.length > 0 && (
            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
              {earnedBadgeIds.length}
            </span>
          )}
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-bold text-primary hover:bg-primary/5"
        >
          {showAll ? (
            <><ChevronUp className="w-4 h-4 mr-1" /> Ver menos</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1" /> Ver todas</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4 animate-in fade-in duration-500">
        {visibleBadges.map((badge) => {
          const isEarned = earnedBadgeIds.includes(badge.id);
          return (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-300",
                    isEarned ? "scale-100" : "opacity-30 grayscale scale-90"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm border-2",
                      isEarned ? "bg-accent/10 border-accent" : "bg-muted border-muted-foreground/10"
                    )}>
                      {badge.icon}
                    </div>
                    <span className="text-[8px] font-bold text-center leading-tight uppercase tracking-tighter">
                      {badge.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white border text-foreground p-3 rounded-2xl shadow-xl max-w-[200px]">
                  <p className="font-bold text-xs">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                  {!isEarned && (
                    <p className="text-[9px] text-destructive mt-1 font-bold">Bloqueado</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {!showAll && ALL_BADGES.length > 8 && (
        <p className="text-[10px] text-center text-muted-foreground italic">
          + {ALL_BADGES.length - 8} insígnias por descobrir...
        </p>
      )}
    </div>
  );
}
