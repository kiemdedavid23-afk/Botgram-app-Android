/**
 * Messages d'erreur suppression compte (codes Worker → texts.ts).
 */
import {texts} from '../texts';

export function mapDeleteError(code: string | null): string {
  if (!code) return texts.errorGeneric;
  if (code === 'CODE_INVALID') return texts.errorCodeInvalid;
  if (code === 'ACCOUNT_CLEANUP_PENDING') return texts.errorCleanupPending;
  if (code === 'EMAIL_NOT_VERIFIED') return texts.errorEmailNotVerified;
  if (code === 'RATE_LIMITED' || code === 'TOO_MANY_REQUESTS') {
    return texts.errorRateLimit;
  }
  return texts.errorGeneric;
}
