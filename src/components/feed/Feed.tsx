"use client";

import * as React from 'react';
import { useStore, store, Post, PostType } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import { Plus, Filter } from 'lucide-react';

export default function Feed({ initialShowCreate = false, onCreated }: { initialShowCreate?: boolean, onCreated?: () => void }) {
  const { posts, currentUser } = useStore();
  const [showCreate, setShowCreate] = React.useState(initialShowCreate);
  const [filterType, setFilterType] = React.useState<PostType | 'Tudo'>('Tudo');

  const filteredPosts = posts.filter(p => {
    if (filterType !== 'Tudo' && p.tipo !== filterType) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl text-primary">Comunidade</h2>
        <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-full h-10 w-10 p-0">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Tudo', 'Ajuda', 'SOS', 'Partilha', 'Evento'].map((t) => (
          <Badge
            key={t}
            variant={filterType === t ? 'default' : 'secondary'}
            className="cursor-pointer px-4 py-1.5 whitespace-nowrap"
            onClick={() => setFilterType(t as any)}
          >
            {t}
          </Badge>
        ))}
      </div>

      {showCreate && (
        <CreatePost onClose={() => {
          setShowCreate(false);
          if (onCreated) onCreated();
        }} />
      )}

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-10">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-3xl">🇵🇹</div>
            <h3 className="font-medium text-lg">Ainda não há posts na tua zona.</h3>
            <p className="text-muted-foreground text-sm">Sê o primeiro a conectar-te com os vizinhos em {currentUser?.distrito}!</p>
            <Button onClick={() => setShowCreate(true)}>Publicar Agora</Button>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}