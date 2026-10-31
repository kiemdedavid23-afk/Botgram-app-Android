/** GET /app/updates — publique (sans session) : ?platform=&channel=&build= */
import {http, type HttpResult} from '../http';
import {env} from '../../config/env';

export type UpdateCheckRaw = {update?: string; latest?: unknown};

export async function fetchUpdateCheck(): Promise<HttpResult<UpdateCheckRaw>> {
  const q = new URLSearchParams({
    platform: env.platform,
    channel: env.appChannel,
    build: String(env.appBuild),
  });
  return http<UpdateCheckRaw>({
    method: 'GET',
    path: `/app/updates?${q.toString()}`,
  });
}
