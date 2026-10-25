import {registerMemberDataCleaner} from '../utils/memberData';
import {getMediaStorage} from './MediaStorage';

let done = false;

/** À appeler une fois au boot (App). */
export function registerMediaStorageCleaner(): void {
  if (done) return;
  done = true;
  registerMemberDataCleaner(() => getMediaStorage().clearAll());
}
