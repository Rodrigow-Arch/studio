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
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    
    filteredText = filteredText.replace(regex, (match) => '#'.repeat(match.length));
  });
  
  return filteredText;
}

/**
 * Verifica se um utilizador está online (ativo nos últimos 5 minutos)
 */
export function isUserOnline(lastActive: string | undefined): boolean {
  if (!lastActive) return false;
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
  return diffInMinutes < 5;
}

/**
 * Utilitário para processar o crop da imagem e retornar um base64
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg', 0.8));
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
