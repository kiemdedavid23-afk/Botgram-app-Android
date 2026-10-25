
import {registerMemberDataCleaner} from '../utils/memberData';
import {getMediaStorage} from './MediaStorage';
import {fireAndForget} from '../utils/fireAndForget';

let done = false;

/** À appeler une fois au boot (App). */
export function registerMediaStorageCleaner(): void {
  if (done) return;
  done = true;
  registerMemberDataCleaner(() => {
    fireAndForget(getMediaStorage().clearAll());
  });
}
