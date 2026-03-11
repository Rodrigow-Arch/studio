"use client";

import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Shield, BookOpen } from "lucide-react";

export default function GroupsPage() {
  const { groups } = useStore();

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl text-primary">Grupos</h2>
        <Button variant="outline" size="sm" className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Shield, label: 'Vizinhos', color: 'bg-blue-50 text-blue-600' },
          { icon: Users, label: 'Família', color: 'bg-green-50 text-green-600' },
          { icon: BookOpen, label: 'Escola', color: 'bg-purple-50 text-purple-600' },
        ].map(cat => (
          <div key={cat.label} className={`p-4 rounded-2xl ${cat.color} flex flex-col items-center gap-2 border`}>
            <cat.icon className="w-6 h-6" />
            <span className="text-sm font-bold">{cat.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="font-headline text-lg">Os teus Grupos</h3>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-secondary/20 rounded-2xl">
            <Users className="w-12 h-12 text-muted" />
            <p className="text-sm text-muted-foreground px-10">Ainda não pertences a nenhum grupo. Cria um ou pede um convite!</p>
            <Button size="sm">Procurar Grupos</Button>
          </div>
        ) : (
          groups.map(g => (
            <Card key={g.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">{g.nome}</p>
                  <p className="text-xs text-muted-foreground">{g.membros.length} membros</p>
                </div>
                <Button size="sm" variant="ghost">Ver</Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}