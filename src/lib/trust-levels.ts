/**
 * @fileOverview Lógica de níveis de confiança baseados em pontos (Bronze -> Lenda).
 */

export interface TrustLevel {
  minPoints: number;
  label: string;
  icon: string;
  color: string;
  bg?: string;
}

export const TRUST_LEVELS: TrustLevel[] = [
  { minPoints: 5000, label: "Lenda de Portugal", icon: "👑", color: "text-purple-700", bg: "bg-purple-100" },
  { minPoints: 2500, label: "Selo Diamante", icon: "💎", color: "text-blue-700", bg: "bg-blue-100" },
  { minPoints: 1000, label: "Selo Ouro", icon: "🥇", color: "text-yellow-700", bg: "bg-yellow-100" },
  { minPoints: 500, label: "Selo Prata", icon: "🥈", color: "text-slate-700", bg: "bg-slate-100" },
  { minPoints: 100, label: "Selo Bronze", icon: "🥉", color: "text-orange-700", bg: "bg-orange-100" },
];

export function getTrustLevel(points: number): TrustLevel | null {
  return TRUST_LEVELS.find(level => points >= level.minPoints) || null;
}
