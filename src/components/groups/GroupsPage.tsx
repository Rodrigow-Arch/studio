
"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Shield, BookOpen, ChevronRight, Hash } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import CreateGroup from './CreateGroup';
import GroupDetail from './GroupDetail';

export default function GroupsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [showCreate, setShowCreate] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);

  const groupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );
  }, [db, user]);

  const { data: groups, isLoading } = useCollection(groupsQuery);

  if (selectedGroupId) {
    return <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl text-primary">Grupos</h2>
        <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> Criar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Shield, label: 'Vizinhos', color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { icon: Users, label: 'Família', color: 'bg-green-50 text-green-600 border-green-100' },
          { icon: BookOpen, label: 'Outros', color: 'bg-purple-50 text-purple-600 border-purple-100' },
        ].map(cat => (
          <div key={cat.label} className={`p-3 rounded-2xl ${cat.color} flex flex-col items-center gap-1 border text-center shadow-sm`}>
            <cat.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{cat.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="font-headline text-lg">Os teus Grupos</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary/30 animate-pulse rounded-2xl" />)}
          </div>
        ) : !groups || groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-secondary/10 rounded-3xl border border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Users className="w-8 h-8 text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Ainda não tens grupos</p>
              <p className="text-xs text-muted-foreground px-10">Cria um grupo para tarefas privadas com os teus vizinhos ou família.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>Criar Primeiro Grupo</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <Card 
                key={group.id} 
                className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedGroupId(group.id)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-4 gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{group.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {group.memberIds?.length || 0} membros • {group.type}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="px-4 py-2 bg-secondary/20 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-primary/60 uppercase">Código: {group.inviteCode}</span>
                    <span className="text-[9px] text-muted-foreground">Ver tarefas</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateGroup onClose={() => setShowCreate(false)} />}
    </div>
  );
}
