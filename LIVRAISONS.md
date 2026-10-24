# LIVRAISONS — Botgram App

## Partie 0 + L5a + L5b (audit réserves 2026-10-24)

### Partie 0
| Fichier | Rôle |
|---------|------|
| `src/app/useRealtimeLifecycle.ts` | start/stop transport ; session.revoked ; **abonnement unique** events → store ; bot actif ; resync bots |
| `src/app/App.tsx` | monte le hook |
| `__tests__/realtime-lifecycle.test.ts` | start/stop / revoked |

### L5a (rappel)
`src/core/realtime/*`, `src/core/api/endpoints/realtime.ts`, tests transport.

### L5b
| Fichier | Rôle |
|---------|------|
| `src/core/api/endpoints/conversations.ts` | list / get / search |
| `src/core/utils/stripPreview.ts` | aperçu sans balises |
| `src/features/conversations/store/*` | store, merge, filters, applyEvent |
| `src/features/conversations/screens/ConversationsScreen.tsx` | écran découpé |
| `src/features/conversations/components/*` | Row, FoldersBar, Body |
| `src/features/conversations/hooks/useConversationSearch.ts` | debounce 300 ms |
| `src/shared/theme/conversationsMetrics.ts` | métriques + sources CSS |
| `src/shared/components/Avatar.tsx`, `SearchBar.tsx` | partagés |
| `src/app/dev/ShellSwitcher.tsx` | onglet chats + badge |

### Réserves corrigées
1. Abonnement temps réel **niveau app** (useRealtimeLifecycle) ; setBotId hors écran ; message.new hors écran → unreadTotal.
2. resync `bots` → `botsStore.load(true)` via le même abonnement (R3).
3. Courses : après chaque await, contrôle `botId` / `searchQuery`.
4. Cache : toutes les clés `conversations.page1.*` effacées au clear (13.5).
5. Valeurs dures → conversationsMetrics / texts.loadError.
6. R9 : écran découpé ; store ≤ 300 lignes.
7. bumpToTop retiré ; pas de fichier parasite `&`.
8. offline seulement si status === 0 ; removed décompte unreadTotal.

### Nouvelles métriques (valeur → clé → source)
| valeur | clé | source |
|--------|-----|--------|
| 6 | folderTabGap | ConversationsPage.css .folder-tab gap |
| 5 | folderCountPadH | .folder-tab__count padding |
| 6 | badgePadH | .chat-item__badge |
| 16 | searchingOffset | position indicateur |
| 14 | pinIconSize | icône épingle liste |
| 8 | rowGap / searchRowGap | gaps ligne / SearchBar |
| 4 | titleRowGap | gap titre |
| 12 | footerSpinnerMargin | pied de liste |

### Non fait
L5c (fil), archives, FAB, swipe, POST read, BotShell hors __DEV__.

### Preuves CI (à coller)

```
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```
