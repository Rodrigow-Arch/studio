/**
 * @fileOverview Lógica de níveis de confiança baseados em pontos.
 */

export interface TrustLevel {
  minPoints: number;
  label: string;
  icon: string;
  color: string;
  bg?: string;
}

export const TRUST_LEVELS: TrustLevel[] = [
  { minPoints: 5000, label: "Lenda de Portugal", icon: "👑", color: "text-purple-600", bg: "bg-purple-50" },
  { minPoints: 2500, label: "Herói Local", icon: "💎", color: "text-blue-600", bg: "bg-blue-50" },
  { minPoints: 1000, label: "Pilar da Comunidade", icon: "🥇", color: "text-yellow-600", bg: "bg-yellow-50" },
  { minPoints: 500, label: "Vizinho Ativo", icon: "🥈", color: "text-slate-600", bg: "bg-slate-50" },
  { minPoints: 100, label: "Membro de Confiança", icon: "🥉", color: "text-orange-600", bg: "bg-orange-50" },
];

export function getTrustLevel(points: number): TrustLevel | null {
  return TRUST_LEVELS.find(level => points >= level.minPoints) || null;
}
