/**
 * Ouvre la messagerie de l'utilisateur depuis l'écran « code de vérification ».
 * Android/iOS ne permettent pas de lire le code dans l'e-mail : on emmène simplement
 * l'utilisateur à sa boîte de réception, il copie le code puis revient (voir CodeScreen).
 */
import {Linking} from 'react-native';

export type MailTarget = {label: string; urls: string[]};

/** Choisit le bouton et les liens à essayer (dans l'ordre) selon le domaine de l'e-mail. */
export function mailTargetFor(email: string): MailTarget {
  const domain = email.split('@')[1]?.trim().toLowerCase() ?? '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      label: 'Ouvrir Gmail',
      urls: ['googlegmail://', 'https://mail.google.com/mail/u/0/#inbox'],
    };
  }
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) {
    return {
      label: 'Ouvrir Outlook',
      urls: ['ms-outlook://', 'https://outlook.live.com/mail/0/inbox'],
    };
  }
  if (/^(yahoo|ymail)\./.test(domain)) {
    return {label: 'Ouvrir Yahoo Mail', urls: ['ymail://', 'https://mail.yahoo.com']};
  }
  if (/^(icloud|me|mac)\./.test(domain)) {
    return {label: 'Ouvrir ma messagerie', urls: ['https://www.icloud.com/mail']};
  }
  return {label: 'Ouvrir ma messagerie', urls: ['mailto:']};
}

/** Essaie chaque lien jusqu'à ce que l'un s'ouvre. Renvoie false si aucun n'a marché. */
export async function openMailApp(email: string): Promise<boolean> {
  for (const url of mailTargetFor(email).urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // lien non pris en charge sur cet appareil : on essaie le suivant
    }
  }
  return false;
}
