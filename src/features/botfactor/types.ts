/** Types Botfactor : assistant guidé de gestion du profil d'un bot. */
export type FactorAction =
  | 'setname'
  | 'setdescription'
  | 'setshortdescription'
  | 'setcommands'
  | 'setmenubutton'
  | 'setrights'
  | 'setphoto';

export type QuickReply = {label: string; value: string};

export type FlowData = Record<string, string>;

export type FlowStep = {
  id: string;
  type: 'info' | 'text' | 'choice' | 'confirm';
  prompt: string | ((data: FlowData) => string);
  choices?: QuickReply[];
  /** Message d'erreur, ou null si la valeur est valide. */
  validate?: (value: string) => string | null;
  /** Étape ignorée selon les réponses déjà données. */
  skipIf?: (data: FlowData) => boolean;
  /** Réponse rapide « laisser vide » proposée sur une étape texte. */
  allowEmpty?: boolean;
};

export type FactorCommand = {
  id: FactorAction;
  /** Identifiant technique, jamais affiché. */
  label: string;
  /** Titre affiché à l'utilisateur. */
  title: string;
  /** Mots clés acceptés pour retrouver l'action (sans accents, minuscules). */
  keywords: string[];
  description: string;
  longDescription: string;
  menuLabel: string;
  unsupported?: boolean;
  steps: FlowStep[];
};

export type FactorMessage = {
  id: string;
  from: 'bot' | 'me';
  text: string;
  actions?: QuickReply[];
};

export type EngineResult = {text: string; actions?: QuickReply[]};
