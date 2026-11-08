/**
 * Organisation du hub Paramètres (compte entreprise) : trois groupes, chaque réglage une seule fois.
 * « account » s'ouvre depuis la carte du haut et « folders » depuis Discussions : ils ne figurent pas ici.
 */
import type {SettingsRoute} from './BotSettingsHubScreen';

export type HubGroupId = 'mySpace' | 'securityData' | 'help';

export type HubGroup = {
  id: HubGroupId;
  title: string;
  routes: readonly SettingsRoute[];
};

export const COMPANY_HUB_GROUPS: readonly HubGroup[] = [
  {id: 'mySpace', title: 'Mon espace', routes: ['appearance', 'discussions', 'language']},
  {id: 'securityData', title: 'Sécurité et données', routes: ['permissions', 'storage']},
  {id: 'help', title: 'Aide', routes: ['documentation']},
];
