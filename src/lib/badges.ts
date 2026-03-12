/**
 * @fileOverview Definição de todas as insígnias (badges) do Portugal Unido com lógica de progresso.
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'Ajuda' | 'SOS' | 'Partilha' | 'Financeiro' | 'Avaliação' | 'Evento' | 'Grupo' | 'Comunicação' | 'Especial';
  icon: string;
  criteria: (user: any) => boolean;
  getValue: (user: any) => number;
  goal: number;
}

export const ALL_BADGES: Badge[] = [
  // AJUDA
  { 
    id: 'ajuda_1', 
    name: 'Primeiro Passo', 
    description: 'Ajudar 1 pessoa', 
    category: 'Ajuda', 
    icon: '🤝', 
    criteria: u => (u.helpsGiven || 0) >= 1,
    getValue: u => u.helpsGiven || 0,
    goal: 1
  },
  { 
    id: 'ajuda_5', 
    name: 'Mão Amiga', 
    description: 'Ajudar 5 pessoas', 
    category: 'Ajuda', 
    icon: '🙌', 
    criteria: u => (u.helpsGiven || 0) >= 5,
    getValue: u => u.helpsGiven || 0,
    goal: 5
  },
  { 
    id: 'ajuda_10', 
    name: 'Vizinho de Confiança', 
    description: 'Ajudar 10 pessoas', 
    category: 'Ajuda', 
    icon: '💪', 
    criteria: u => (u.helpsGiven || 0) >= 10,
    getValue: u => u.helpsGiven || 0,
    goal: 10
  },
  { 
    id: 'ajuda_25', 
    name: 'Super Vizinho', 
    description: 'Ajudar 25 pessoas', 
    category: 'Ajuda', 
    icon: '🌟', 
    criteria: u => (u.helpsGiven || 0) >= 25,
    getValue: u => u.helpsGiven || 0,
    goal: 25
  },
  { 
    id: 'ajuda_50', 
    name: 'Herói da Comunidade', 
    description: 'Ajudar 50 pessoas', 
    category: 'Ajuda', 
    icon: '🏆', 
    criteria: u => (u.helpsGiven || 0) >= 50,
    getValue: u => u.helpsGiven || 0,
    goal: 50
  },
  { 
    id: 'ajuda_100', 
    name: 'Lenda Viva', 
    description: 'Ajudar 100 pessoas', 
    category: 'Ajuda', 
    icon: '👑', 
    criteria: u => (u.helpsGiven || 0) >= 100,
    getValue: u => u.helpsGiven || 0,
    goal: 100
  },
  
  // SOS
  { 
    id: 'sos_1', 
    name: 'Primeiro Socorro', 
    description: 'Resolver 1 SOS urgente', 
    category: 'SOS', 
    icon: '🚨', 
    criteria: u => (u.sosResolved || 0) >= 1,
    getValue: u => u.sosResolved || 0,
    goal: 1
  },
  { 
    id: 'sos_5', 
    name: 'Guardião', 
    description: 'Resolver 5 SOS urgentes', 
    category: 'SOS', 
    icon: '🦺', 
    criteria: u => (u.sosResolved || 0) >= 5,
    getValue: u => u.sosResolved || 0,
    goal: 5
  },
  
  // PARTILHAS
  { 
    id: 'partilha_1', 
    name: 'Primeira Partilha', 
    description: 'Fazer 1 partilha gratuita', 
    category: 'Partilha', 
    icon: '♻️', 
    criteria: u => (u.sharesMade || 0) >= 1,
    getValue: u => u.sharesMade || 0,
    goal: 1
  },
  { 
    id: 'partilha_5', 
    name: 'Zero Desperdício', 
    description: 'Fazer 5 partilhas gratuitas', 
    category: 'Partilha', 
    icon: '🌱', 
    criteria: u => (u.sharesMade || 0) >= 5,
    getValue: u => u.sharesMade || 0,
    goal: 5
  },
  { 
    id: 'partilha_15', 
    name: 'Coração Generoso', 
    description: 'Fazer 15 partilhas gratuitas', 
    category: 'Partilha', 
    icon: '🎁', 
    criteria: u => (u.sharesMade || 0) >= 15,
    getValue: u => u.sharesMade || 0,
    goal: 15
  },
  
  // TAREFAS PAGAS
  { 
    id: 'pago_1', 
    name: 'Primeiro Euro', 
    description: 'Completar 1 tarefa paga', 
    category: 'Financeiro', 
    icon: '💶', 
    criteria: u => (u.paidTasksCompleted || 0) >= 1,
    getValue: u => u.paidTasksCompleted || 0,
    goal: 1
  },
  { 
    id: 'pago_5', 
    name: 'Profissional', 
    description: 'Completar 5 tarefas pagas', 
    category: 'Financeiro', 
    icon: '💼', 
    criteria: u => (u.paidTasksCompleted || 0) >= 5,
    getValue: u => u.paidTasksCompleted || 0,
    goal: 5
  },
  
  // AVALIAÇÕES
  { 
    id: 'rating_1', 
    name: 'Primeira Estrela', 
    description: 'Receber 1 avaliação', 
    category: 'Avaliação', 
    icon: '⭐', 
    criteria: u => (u.totalRatings || 0) >= 1,
    getValue: u => u.totalRatings || 0,
    goal: 1
  },
  { 
    id: 'rating_top', 
    name: 'Perfeito', 
    description: 'Média 5.0 com 5+ avaliações', 
    category: 'Avaliação', 
    icon: '💫', 
    criteria: u => (u.averageRating || 0) >= 4.9 && (u.totalRatings || 0) >= 5,
    getValue: u => u.totalRatings || 0,
    goal: 5
  },
  
  // EVENTOS
  { 
    id: 'evento_1', 
    name: 'Animador', 
    description: 'Criar 1 evento comunitário', 
    category: 'Evento', 
    icon: '🎉', 
    criteria: u => (u.eventsCreated || 0) >= 1,
    getValue: u => u.eventsCreated || 0,
    goal: 1
  },
  
  // GRUPOS
  { 
    id: 'grupo_1', 
    name: 'Fundador', 
    description: 'Criar 1 grupo', 
    category: 'Grupo', 
    icon: '👥', 
    criteria: u => (u.groupsAdmin || 0) >= 1,
    getValue: u => u.groupsAdmin || 0,
    goal: 1
  },
  { 
    id: 'grupo_join', 
    name: 'Conector', 
    description: 'Entrar em 5 grupos diferentes', 
    category: 'Grupo', 
    icon: '🤗', 
    criteria: u => (u.groupsJoined || 0) >= 5,
    getValue: u => u.groupsJoined || 0,
    goal: 5
  },
  
  // COMUNICAÇÃO
  { 
    id: 'comm_1', 
    name: 'Primeira Voz', 
    description: 'Fazer 1 comentário', 
    category: 'Comunicação', 
    icon: '💬', 
    criteria: u => (u.commentsMade || 0) >= 1,
    getValue: u => u.commentsMade || 0,
    goal: 1
  },
  { 
    id: 'comm_post_10', 
    name: 'Escritor', 
    description: 'Publicar 10 posts', 
    category: 'Comunicação', 
    icon: '✍️', 
    criteria: u => (u.postsCreated || 0) >= 10,
    getValue: u => u.postsCreated || 0,
    goal: 10
  },
  
  // ESPECIAIS
  { 
    id: 'portugal_100', 
    name: 'Português de Gema', 
    description: 'Completar perfil 100%', 
    category: 'Especial', 
    icon: '🇵🇹', 
    criteria: u => u.description && u.phoneNumber && u.district,
    getValue: u => (u.description ? 1 : 0) + (u.phoneNumber ? 1 : 0) + (u.district ? 1 : 0),
    goal: 3
  },
];