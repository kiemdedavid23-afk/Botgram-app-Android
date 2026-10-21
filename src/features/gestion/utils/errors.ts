import {texts} from '../texts';

export function gestionErrorMessage(code: string | undefined): string {
  if (!code) return texts.toastErrorGeneric;
  if (code === 'RATE_LIMITED' || code === 'TOO_MANY_REQUESTS') {
    return texts.toastError429;
  }
  if (code === 'BOT_CLEANUP_PENDING') return texts.toastError409;
  if (code === 'EMAIL_NOT_VERIFIED') return texts.toastErrorEmail;
  return texts.toastErrorGeneric;
}
