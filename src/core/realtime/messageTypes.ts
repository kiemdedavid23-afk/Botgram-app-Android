/** Types message / album (partagés REST + realtime). */
/** Bouton inline (BUTTONS.md). */
export type InlineButton = {
  text: string;
  url?: string;
  callback_data?: string;
};

/** Message (GET /conversations/:id/messages + événements realtime). Un seul type. */
export type Message = {
  id: string;
  conversation_id: string;
  direction: 'in' | 'out';
  kind: 'text' | 'photo' | 'document' | 'callback_query' | 'other' | 'album' | string;
  status?: string;
  text?: string | null;
  parse_mode?: 'HTML' | 'MarkdownV2' | string | null;
  buttons?: InlineButton[][] | null;
  callback?: {data: string; label: string} | null;
  attachment?: {name?: string; mime?: string; size?: number} | null;
  created_at?: number;
  sent_at?: number | null;
  edited_at?: number | null;
  telegram_message_id?: number | null;
  error_code?: string | null;
  retryable?: boolean;
  retry_at?: number | null;
  client_message_id?: string | null;
  /** Album entrant regroupé (Worker v15.5). */
  album?: AlbumItem[] | null;
};

export type AlbumItem = {
  id: string;
  kind: string;
  text?: string | null;
  telegram_message_id?: number | null;
  attachment?: {name?: string; mime?: string; size?: number} | null;
  created_at?: number;
  expires_at?: number | null;
};

/** @deprecated alias — utiliser Message */
export type MessagePayload = Message;

