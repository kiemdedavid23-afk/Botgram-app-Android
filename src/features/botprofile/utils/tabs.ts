/** Onglets profil bot : Identité · Langues · Commandes · Infos. */
import type {LucideIcon} from 'lucide-react-native';
import {User, Languages, Terminal, Info} from 'lucide-react-native';
import {texts} from '../texts';

export type TabId = 'identity' | 'languages' | 'commands' | 'info';

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
    title: 'Identité',
    hint: 'Nom et descriptions du bot, pour chaque langue.',
  },
  {
    id: 'languages',
    label: texts.tabLanguages,
    Icon: Languages,
    title: 'Langues',
    hint: 'Les langues dans lesquelles le profil est traduit.',
  },
  {
    id: 'commands',
    label: texts.tabCommands,
    Icon: Terminal,
    title: 'Commandes',
    hint: 'Les commandes proposées quand on tape « / » dans la discussion.',
  },
  {
    id: 'info',
    label: texts.tabInfo,
    Icon: Info,
    title: 'Infos',
    hint: 'Pseudo, état du bot et dernière synchronisation avec Telegram.',
  },
];
