
"use client";

import * as React from 'react';
import { ALL_BADGES } from '@/lib/badges';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Award, Info, CheckCircle2 } from 'lucide-react';

interface BadgeGridProps {
  userProfile: any;
}

export default function BadgeGrid({ userProfile }: BadgeGridProps) {
  const [showAll, setShowAll] = React.useState(false);
  const earnedBadgeIds = userProfile?.earnedBadges || [];
  
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
          className="text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all active:bg-primary"
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
          const currentValue = badge.getValue(userProfile);
          const progressPercent = Math.min(100, (currentValue / badge.goal) * 100);

          return (
            <TooltipProvider key={badge.id} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-300 relative",
                    isEarned ? "scale-100" : "opacity-40 grayscale scale-90"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm border-2",
                      isEarned ? "bg-accent/10 border-accent animate-in zoom-in-50" : "bg-muted border-muted-foreground/10"
                    )}>
                      {badge.icon}
                    </div>
                    <span className="text-[8px] font-black text-center leading-tight uppercase tracking-tighter max-w-[60px] truncate">
                      {badge.name}
                    </span>
                    {!isEarned && (
                      <div className="absolute -top-1 -right-1 bg-white border rounded-full p-0.5 shadow-xs">
                        <Info className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-white border text-foreground p-4 rounded-2xl shadow-2xl max-w-[240px] z-[200]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{badge.icon}</span>
                      <div>
                        <p className="font-black text-xs uppercase tracking-tight">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                        <span className="text-primary flex items-center gap-1">
                          {isEarned ? <><CheckCircle2 className="w-3 h-3" /> Concluído!</> : 'Como conseguir:'}
                        </span>
                        {!isEarned && (
                          <span className="text-muted-foreground">{currentValue} / {badge.goal}</span>
                        )}
                      </div>
                      {!isEarned && (
                        <Progress value={progressPercent} className="h-1.5 bg-secondary/50" />
                      )}
                      <p className="text-[10px] italic text-muted-foreground leading-snug">
                        {isEarned ? 'Já desbloqueaste este mérito comunitário.' : `Necessário completar ${badge.goal} ${badge.description.toLowerCase().split(' ').slice(1).join(' ')}.`}
                      </p>
                    </div>
                  </div>
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
