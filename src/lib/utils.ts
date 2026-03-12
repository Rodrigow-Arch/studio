import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PROFANE_WORDS = [
  // Português
  'caralho', 'porra', 'puta', 'merda', 'foda', 'cabrao', 'cabrão', 'fodase', 'foda-se', 'paneleiro', 'pila', 'cona', 'pixa', 'piça', 'caralhao', 'putedo', 'foder', 'fodasse', 'estupido', 'estúpido', 'idiota', 'cagao', 'cagão', 'cu', 'fodinha', 'fodeu',
  // Inglês
  'fuck', 'shit', 'bitch', 'ass', 'cunt', 'dick', 'pussy', 'bastard', 'asshole', 'fucker', 'motherfucker', 'cock', 'wanker', 'nigger', 'faggot', 'slut', 'whore',
  // Espanhol (comum)
  'mierda', 'puta', 'cabron', 'cabrón', 'joder', 'pendejo'
];

/**
 * Filtra palavras impróprias substituindo-as por #
 */
export function filterProfanity(text: string): string {
  if (!text) return text;
  
  let filteredText = text;
  
  PROFANE_WORDS.forEach(word => {
    // Regex para encontrar a palavra (case insensitive e limites de palavra)
    // Usamos uma abordagem que lida com acentos básicos e substitui caracteres
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    
    filteredText = filteredText.replace(regex, (match) => '#'.repeat(match.length));
  });
  
  return filteredText;
}
