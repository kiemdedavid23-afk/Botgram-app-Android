/** Onglets profil bot — site BotProfilePage TABS */
import type {LucideIcon} from 'lucide-react-native';
import {
  User,
  Languages,
  Terminal,
  LayoutGrid,
  Shield,
  Info,
} from 'lucide-react-native';
import {texts} from '../texts';

export type TabId =
  | 'identity'
  | 'languages'
  | 'commands'
  | 'menu'
  | 'rights'
  | 'info';

export const PROFILE_TABS: {
  id: TabId;
  label: string;
  Icon: LucideIcon;
  title: string;
  hint: string;
}[] = [
  {
    id: 'identity',
    label: texts.tabIdentity,
    Icon: User,
    title: 'Identité du bot',
    hint: 'Nom, description et description courte, par langue.',
  },
  {
    id: 'languages',
    label: texts.tabLanguages,
    Icon: Languages,
    title: 'Langues',
    hint: 'Les langues dans lesquelles le profil de votre bot est traduit.',
  },
  {
    id: 'commands',
    label: texts.tabCommands,
    Icon: Terminal,
    title: 'Commandes',
    hint: 'Les commandes proposées quand on tape « / » dans la discussion.',
  },
  {
    id: 'menu',
    label: texts.tabMenu,
    Icon: LayoutGrid,
    title: 'Bouton de menu',
    hint: 'Le bouton affiché à côté du champ de message.',
  },
  {
    id: 'rights',
    label: texts.tabRights,
    Icon: Shield,
    title: "Droits d'administrateur",
    hint: 'Droits proposés quand le bot est ajouté à un groupe ou un canal.',
  },
  {
    id: 'info',
    label: texts.tabInfo,
    Icon: Info,
    title: 'Infos Telegram',
    hint: "L'état du bot côté Telegram et la synchronisation.",
  },
];
