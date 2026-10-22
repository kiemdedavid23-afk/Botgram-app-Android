import {texts} from '../texts';

export function mapProfileError(code: string | undefined): string {
  if (!code) return texts.errorGeneric;
  switch (code) {
    case 'RATE_LIMITED':
    case 'TOO_MANY_REQUESTS':
    case 'RETRY_TOO_EARLY':
      return texts.error429;
    case 'EMAIL_NOT_VERIFIED':
      return texts.errorEmail;
    case 'TOKEN_INVALID':
      return texts.errorTokenInvalid;
    case 'BOT_DISCONNECTED':
      return texts.errorBotDisconnected;
    case 'network_error':
    case 'NETWORK':
      return texts.errorNetwork;
    case 'VALIDATION_ERROR':
      return texts.errorValidation;
    case 'SERVICE_UNAVAILABLE':
    case 'TELEGRAM_ERROR':
      return texts.errorServer;
    default:
      return texts.errorUnknown;
  }
}
