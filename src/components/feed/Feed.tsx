
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { Plus, LayoutGrid, Globe } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { calculateDistance } from '@/lib/geo';

interface FeedProps {
  onProfileClick: (uid: string) => void;
}

export default function Feed({ onProfileClick }: FeedProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [showCreate, setShowCreate] = React.useState(false);
  const [filterType, setFilterType] = React.useState<string>('Tudo');

  const userDocRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc(userDocRef);

  const postsQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'posts'), 
      orderBy('timestamp', 'desc')
    );
  }, [db]);

  const { data: allPosts, isLoading } = useCollection(postsQuery);

  const sortedAndFilteredPosts = React.useMemo(() => {
    if (!allPosts || !currentUserProfile) return [];
    
    const now = new Date();
    
    // 1. Filtragem inicial
    let filtered = allPosts.filter(p => {
      const isPublic = !p.groupId || p.isPublic;
      const matchesType = filterType === 'Tudo' || p.type === filterType;
      
      if (p.status === 'resolvido' && p.expiresAt) {
        const expiresAt = new Date(p.expiresAt);
        if (now > expiresAt) return false;
      }
      
      return isPublic && matchesType;
    });

    // 2. Ordenação Inteligente (70% Proximidade, 30% Pontos)
    // Regra: 0 pontos vão para o fim
    return filtered.sort((a, b) => {
      const pointsA = a.authorPoints || 0;
      const pointsB = b.authorPoints || 0;

      // Utilizadores com 0 pontos aparecem no fim
      if (pointsA === 0 && pointsB > 0) return 1;
      if (pointsB === 0 && pointsA > 0) return -1;

      const distA = calculateDistance(currentUserProfile.latitude, currentUserProfile.longitude, a.latitude, a.longitude);
      const distB = calculateDistance(currentUserProfile.latitude, currentUserProfile.longitude, b.latitude, b.longitude);

      // Normalização simples para scores (valores menores de distância são melhores)
      // Usamos uma distância de referência de 50km
      const proxScoreA = Math.max(0, 1 - (distA / 50));
      const proxScoreB = Math.max(0, 1 - (distB / 50));

      // Normalização de pontos (referência 5000 pontos)
      const pointsScoreA = Math.min(1, pointsA / 5000);
      const pointsScoreB = Math.min(1, pointsB / 5000);

      const scoreA = (proxScoreA * 0.7) + (pointsScoreA * 0.3);
      const scoreB = (proxScoreB * 0.7) + (pointsScoreB * 0.3);

      return scoreB - scoreA;
    });
  }, [allPosts, filterType, currentUserProfile]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-24 bg-secondary/50 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-secondary/50 rounded-full animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-secondary/30 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="font-headline text-2xl text-primary">Rede Pública</h2>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-full h-10 w-10 p-0 shadow-lg shadow-primary/20 transition-transform active:scale-90">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Tudo', 'Ajuda', 'SOS', 'Partilha', 'Evento'].map((t) => (
          <Badge
            key={t}
            variant={filterType === t ? 'default' : 'secondary'}
            className={`cursor-pointer px-5 py-2 whitespace-nowrap rounded-full transition-all ${filterType === t ? 'shadow-md scale-105' : 'opacity-80'}`}
            onClick={() => setFilterType(t)}
          >
            {t}
          </Badge>
        ))}
      </div>

      {showCreate && (
        <CreatePost onClose={() => setShowCreate(false)} />
      )}

      <div className="space-y-4 pb-20">
        {sortedAndFilteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 px-10 bg-white rounded-3xl border border-dashed">
            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center text-3xl shadow-inner">🇵🇹</div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Sem publicações públicas</h3>
              <p className="text-muted-foreground text-xs">Sê o primeiro a conectar-te com os teus vizinhos na rede pública!</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="rounded-full px-8">Publicar Agora</Button>
          </div>
        ) : (
          sortedAndFilteredPosts.map(post => (
            <PostCard key={post.id} post={post} onProfileClick={onProfileClick} />
          ))
        )}
      </div>
    </div>
  );
}
