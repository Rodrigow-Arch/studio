
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { Plus, LayoutGrid, Globe } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

interface FeedProps {
  onProfileClick: (uid: string) => void;
}

export default function Feed({ onProfileClick }: FeedProps) {
  const db = useFirestore();
  const [showCreate, setShowCreate] = React.useState(false);
  const [filterType, setFilterType] = React.useState<string>('Tudo');

  const postsQuery = useMemoFirebase(() => {
    return query(
      collection(db, 'posts'), 
      orderBy('timestamp', 'desc')
    );
  }, [db]);

  const { data: allPosts, isLoading } = useCollection(postsQuery);

  const filteredPosts = React.useMemo(() => {
    if (!allPosts) return [];
    
    const now = new Date();
    
    return allPosts.filter(p => {
      const isPublic = !p.groupId || p.isPublic;
      const matchesType = filterType === 'Tudo' || p.type === filterType;
      
      if (p.status === 'resolvido' && p.expiresAt) {
        const expiresAt = new Date(p.expiresAt);
        if (now > expiresAt) return false;
      }
      
      return isPublic && matchesType;
    });
  }, [allPosts, filterType]);

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
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 px-10 bg-white rounded-3xl border border-dashed">
            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center text-3xl shadow-inner">🇵🇹</div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Sem publicações públicas</h3>
              <p className="text-muted-foreground text-xs">Sê o primeiro a conectar-te com os teus vizinhos na rede pública!</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="rounded-full px-8">Publicar Agora</Button>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} onProfileClick={onProfileClick} />
          ))
        )}
      </div>
    </div>
  );
}
