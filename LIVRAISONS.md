# LIVRAISONS — Botgram App

## L5d — Envoi, statuts, Réessayer, marquer lu

### Créés
| Chemin | Rôle |
|--------|------|
| `src/core/utils/uuid.ts` | UUID v4 |
| `src/features/thread/store/sendActions.ts` | send / retry / resend / markRead |
| `src/features/thread/store/reloadPage1.ts` | fusion page 1 |
| `src/features/thread/components/ComposerBar.tsx` | barre de saisie |
| `src/features/thread/components/MessageStatus.tsx` | statuts + actions |
| `__tests__/thread-send.test.ts` | tests L5d |

### Modifiés
| Chemin | Raison |
|--------|--------|
| `src/core/api/endpoints/messages.ts` | sendMessage, retryMessage, markConversationRead |
| `src/core/realtime/events.ts` | client_message_id |
| `src/features/thread/store/threadStore.ts` | wire L5d |
| `src/features/thread/screens/ThreadScreen.tsx` | composer + handlers |
| `src/features/thread/components/MessageBubble.tsx` | MessageStatus |
| `src/features/thread/texts.ts` | libellés L5d |
| `src/shared/theme/threadMetrics.ts` | composer / retry |

### Métriques composer (valeur → clé → source)
| valeur | clé | source |
|--------|-----|--------|
| 8 | composerPad / composerGap | ConversationPage.css .composer |
| 40 | composerInputMinH / sendSize | .composer__input / send |
| 20 | composerInputRadius | border-radius |
| 3800 | charCountThreshold | UX compteur |
| 4096 | maxMessageLength | API |

### Non fait
parse_mode, buttons, reply, médias, file hors ligne, PATCH/DELETE message.

### Preuves CI
*(Coller sorties typecheck / lint / jest.)*
