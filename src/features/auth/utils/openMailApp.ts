/**
 * Ouvre la messagerie de l'utilisateur depuis l'écran « code de vérification ».
 * Android/iOS ne permettent pas de lire le code dans l'e-mail : on emmène simplement
 * l'utilisateur à sa boîte de réception, il copie le code puis revient (voir CodeScreen).
 */
import {Linking, NativeModules, Platform} from 'react-native';

/** Module natif Android (OpenMailModule.kt) : lance l'app de messagerie directement. */
type OpenMailNative = {openInbox(preferredPackage: string | null): Promise<string>};
const nativeOpenMail = NativeModules.OpenMail as OpenMailNative | undefined;

export type MailTarget = {
  label: string;
  /** Liens essayés dans l'ordre si le module natif est absent ou échoue. */
  urls: string[];
  /** Paquet Android de l'app à lancer en priorité (sinon : app de messagerie par défaut). */
  androidPackage?: string;
};

/** Choisit le bouton et les liens à essayer (dans l'ordre) selon le domaine de l'e-mail. */
export function mailTargetFor(email: string): MailTarget {
  const domain = email.split('@')[1]?.trim().toLowerCase() ?? '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      label: 'Ouvrir Gmail',
      androidPackage: 'com.google.android.gm',
      urls: ['googlegmail://', 'https://mail.google.com/mail/u/0/#inbox'],
    };
  }
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) {
    return {
      label: 'Ouvrir Outlook',
      androidPackage: 'com.microsoft.office.outlook',
      urls: ['ms-outlook://', 'https://outlook.live.com/mail/0/inbox'],
    };
  }
  if (/^(yahoo|ymail)\./.test(domain)) {
    return {
      label: 'Ouvrir Yahoo Mail',
      androidPackage: 'com.yahoo.mobile.client.android.mail',
      urls: ['ymail://', 'https://mail.yahoo.com'],
    };
  }
  if (/^(icloud|me|mac)\./.test(domain)) {
    return {label: 'Ouvrir ma messagerie', urls: ['https://www.icloud.com/mail']};
  }
  return {label: 'Ouvrir ma messagerie', urls: ['mailto:']};
}

/**
 * Android : lance d'abord l'app de messagerie via le module natif (ouvre la boîte de réception).
 * Sinon (iOS, module absent, aucune app) : essaie chaque lien jusqu'à ce que l'un s'ouvre.
 * Renvoie false si rien n'a pu s'ouvrir.
 */
export async function openMailApp(email: string): Promise<boolean> {
  const target = mailTargetFor(email);
  if (Platform.OS === 'android' && nativeOpenMail) {
    try {
      await nativeOpenMail.openInbox(target.androidPackage ?? null);
      return true;
    } catch {
      // aucune app de messagerie trouvée : repli sur les liens ci-dessous
    }
  }
  for (const url of target.urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // lien non pris en charge sur cet appareil : on essaie le suivant
    }
  }
  return false;
}
