/**
 * @fileOverview Expansão para 50 insígnias (badges) com lógica de progresso.
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

const createBadges = () => {
  const b: Badge[] = [];

  // AJUDA (8)
  const helps = [1, 5, 10, 25, 50, 100, 250, 500];
  const helpIcons = ['🤝', '🙌', '💪', '🌟', '🏆', '👑', '🔥', '🛡️'];
  helps.forEach((g, i) => b.push({
    id: `ajuda_${g}`, name: `Ajudante ${i+1}`, description: `Ajudar ${g} vizinhos`, category: 'Ajuda', icon: helpIcons[i],
    criteria: u => (u.helpsGiven || 0) >= g, getValue: u => u.helpsGiven || 0, goal: g
  }));

  // SOS (5)
  const sos = [1, 5, 10, 20, 50];
  const sosIcons = ['🚨', '🦺', '🆘', '🚑', '🕊️'];
  sos.forEach((g, i) => b.push({
    id: `sos_${g}`, name: `Guardião ${i+1}`, description: `Resolver ${g} SOS urgentes`, category: 'SOS', icon: sosIcons[i],
    criteria: u => (u.sosResolved || 0) >= g, getValue: u => u.sosResolved || 0, goal: g
  }));

  // PARTILHA (6)
  const shares = [1, 5, 15, 30, 50, 100];
  const shareIcons = ['♻️', '🌱', '🎁', '📦', '🚲', '🍎'];
  shares.forEach((g, i) => b.push({
    id: `partilha_${g}`, name: `Doador ${i+1}`, description: `Fazer ${g} partilhas gratuitas`, category: 'Partilha', icon: shareIcons[i],
    criteria: u => (u.sharesMade || 0) >= g, getValue: u => u.sharesMade || 0, goal: g
  }));

  // EVENTOS (5)
  const events = [1, 3, 5, 10, 25];
  const eventIcons = ['🎉', '🎈', '🎪', '🎙️', '🎭'];
  events.forEach((g, i) => b.push({
    id: `evento_${g}`, name: `Organizador ${i+1}`, description: `Criar ${g} eventos comunitários`, category: 'Evento', icon: eventIcons[i],
    criteria: u => (u.eventsCreated || 0) >= g, getValue: u => u.eventsCreated || 0, goal: g
  }));

  // AVALIAÇÕES (5)
  const ratings = [1, 10, 50, 100, 250];
  ratings.forEach((g, i) => b.push({
    id: `rating_${g}`, name: `Estrela ${i+1}`, description: `Receber ${g} avaliações`, category: 'Avaliação', icon: '⭐',
    criteria: u => (u.totalRatings || 0) >= g, getValue: u => u.totalRatings || 0, goal: g
  }));

  // FINANCEIRO (4)
  const paid = [1, 5, 10, 25];
  paid.forEach((g, i) => b.push({
    id: `pago_${g}`, name: `Profissional ${i+1}`, description: `Completar ${g} tarefas pagas`, category: 'Financeiro', icon: '💶',
    criteria: u => (u.paidTasksCompleted || 0) >= g, getValue: u => u.paidTasksCompleted || 0, goal: g
  }));

  // GRUPOS (5)
  const groupJoins = [1, 3, 5, 10, 20];
  groupJoins.forEach((g, i) => b.push({
    id: `grupo_${g}`, name: `Conector ${i+1}`, description: `Entrar em ${g} grupos`, category: 'Grupo', icon: '👥',
    criteria: u => (u.groupsJoined || 0) >= g, getValue: u => u.groupsJoined || 0, goal: g
  }));

  // COMUNICAÇÃO (4)
  const posts = [1, 10, 50, 100];
  posts.forEach((g, i) => b.push({
    id: `post_${g}`, name: `Escritor ${i+1}`, description: `Publicar ${g} posts no feed`, category: 'Comunicação', icon: '✍️',
    criteria: u => (u.postsCreated || 0) >= g, getValue: u => u.postsCreated || 0, goal: g
  }));

  // ESPECIAL (8)
  b.push({ id: 'perfect_score', name: 'Vizinho Perfeito', description: 'Média 5.0 com 10+ avaliações', category: 'Avaliação', icon: '💫', criteria: u => (u.averageRating || 0) >= 4.95 && (u.totalRatings || 0) >= 10, getValue: u => u.totalRatings || 0, goal: 10 });
  b.push({ id: 'full_profile', name: 'Perfil Exemplar', description: 'Completar 100% do perfil', category: 'Especial', icon: '🇵🇹', criteria: u => u.description && u.phoneNumber && u.photoUrl && u.bannerUrl, getValue: u => (u.description?1:0)+(u.phoneNumber?1:0)+(u.photoUrl?1:0)+(u.bannerUrl?1:0), goal: 4 });
  b.push({ id: 'early_bird', name: 'Pioneiro', description: 'Membro desde os primeiros dias', category: 'Especial', icon: '🐣', criteria: u => true, getValue: u => 1, goal: 1 });
  b.push({ id: 'multi_district', name: 'Viajante', description: 'Ajudar em 2+ distritos diferentes', category: 'Especial', icon: '🗺️', criteria: u => (u.districtsHelped || 0) >= 2, getValue: u => u.districtsHelped || 0, goal: 2 });
  b.push({ id: 'night_owl', name: 'Vigilante Noturno', description: 'Resolver um SOS entre as 00h e as 06h', category: 'Especial', icon: '🦉', criteria: u => u.nightSosResolved >= 1, getValue: u => u.nightSosResolved || 0, goal: 1 });
  b.push({ id: 'community_leader', name: 'Líder de Grupo', description: 'Criar e gerir 3 grupos', category: 'Grupo', icon: '📢', criteria: u => (u.groupsAdmin || 0) >= 3, getValue: u => u.groupsAdmin || 0, goal: 3 });
  b.push({ id: 'top_100', name: 'Top 100 Portugal', description: 'Estar entre os 100 membros com mais pontos', category: 'Especial', icon: '🎖️', criteria: u => u.isTopRanked, getValue: u => 1, goal: 1 });
  b.push({ id: 'faroltech_friend', name: 'Amigo da Faroltech', description: 'Conectar-se com a equipa de desenvolvimento', category: 'Especial', icon: '👨‍💻', criteria: u => u.isDevFriend, getValue: u => 1, goal: 1 });

  return b;
};

export const ALL_BADGES: Badge[] = createBadges();
