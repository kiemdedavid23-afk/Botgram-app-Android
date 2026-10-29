/**
 * Dernier espace ouvert (membre ou bot), mémorisé localement pour que l'app
 * rouvre là où l'utilisateur l'avait laissée. Le bot repris est celui
 * marqué `selected` dans le cache des bots.
 */
import {cacheGetString, cacheSetString, cacheDelete} from '../core/storage';
import {registerMemberDataCleaner} from '../core/utils/memberData';
import {fireAndForget} from '../core/utils/fireAndForget';

export type LastSpace = 'member' | 'bot';

const KEY = 'app.lastSpace';

export async function readLastSpace(): Promise<LastSpace> {
  try {
    return (await cacheGetString(KEY)) === 'bot' ? 'bot' : 'member';
  } catch {
    return 'member';
  }
}

export function saveLastSpace(space: LastSpace): void {
  fireAndForget(cacheSetString(KEY, space));
}

registerMemberDataCleaner(() => cacheDelete(KEY));
