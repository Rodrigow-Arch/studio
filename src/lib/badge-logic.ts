import { doc, getDoc, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { ALL_BADGES } from './badges';

/**
 * Verifica se o utilizador ganhou novas insígnias e atribui-as.
 */
export async function checkAndAwardBadges(db: Firestore, userId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data();
  const currentBadges = userData.earnedBadges || [];
  const newBadges: string[] = [];

  for (const badge of ALL_BADGES) {
    if (!currentBadges.includes(badge.id) && badge.criteria(userData)) {
      newBadges.push(badge.id);
    }
  }

  if (newBadges.length > 0) {
    // 1. Atualizar perfil do utilizador
    await updateDoc(userRef, {
      earnedBadges: arrayUnion(...newBadges)
    });

    // 2. Criar notificações para cada insígnia ganha
    for (const badgeId of newBadges) {
      const badge = ALL_BADGES.find(b => b.id === badgeId);
      if (badge) {
        await addDoc(collection(db, 'users', userId, 'notifications'), {
          userId,
          type: 'badge',
          message: `Parabéns! Ganhaste a insígnia: ${badge.icon} ${badge.name}`,
          badgeId,
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return newBadges;
  }
  
  return [];
}
