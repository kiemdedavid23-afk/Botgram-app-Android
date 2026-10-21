# Livraisons

## L2a — Tests C1 + 0 warning ESLint (no-inline-styles)

### Fichiers modifiés

| Fichier | Avant → Après | Raison |
|---|---|---|
| `__tests__/session-c1.test.ts` | 66 → 303 | Tests C1 complets (refresh_race, retry_after×3, conservation session réseau/timeout/500/429, fin session 4 codes, X-Token-Mode, 426+latest, 401 ordinaire→refresh, authStore boot 429/ACCOUNT_DISABLED, un seul boot, état sans token) |
| `src/app/RootNavigator.tsx` | 152 → 171 | StyleSheet.create ; tokens space/fontSize/fontWeight/radii (Design tokens §3–5) |
| `src/features/auth/screens/CodeScreen.tsx` | 149 → 158 | btnDisabled / resend / resendText (Auth.css) |
| `src/features/auth/screens/EmailScreen.tsx` | 74 → 76 | btnDisabled opacity 0.6 (Auth.css) |
| `src/features/auth/screens/ProfileScreen.tsx` | ~170 → 182 | btnDisabled, pickerScroll maxHeight 360, pickerItemText 17, pickerClose, fieldValue (Auth.css) |
| `src/features/auth/screens/UpgradeScreen.tsx` | 24 → 25 | latest marginTop 12 |
| `src/features/bots/screens/BotManageScreen.tsx` | ~44 → 51 | root flex:1, status marginTop space.xs=4 |
| `src/features/dashboard/screens/DashboardScreen.tsx` | ~66 → 69 | scroll flex:1 |
| `src/shared/components/BotBottomNav.tsx` | 245 → 242 | borderColor actif via variable (plus d'ObjectExpression JSX) |

### Constats
- Le code `session.ts` / `authStore` est déjà conforme aux règles C1 (single-flight, écriture refresh avant access, fin de session uniquement sur les 4 raisons, X-Token-Mode seulement verify/refresh, 426→upgrade_required).
- Guard « un seul boot » : `safeBoot` (module-level `booting`) utilisé par NetInfo/AppState ; `boot()` direct n'a pas de lock interne (documenté par le test).
- Aucun changement visuel ; aucune nouvelle dépendance ; aucun refactor.

### Non fait
- Exécution locale de `jest` / `eslint` (npm ci a échoué : E502 registry). Le propriétaire validera via CI.
- Correction des styles en ligne hors liste CI (ex. `ShellSwitcher`, associate screens) : hors périmètre des 22 warnings fournis.

### Preuve attendue CI
- `npm run typecheck` → 0 erreur
- `npm run lint` → 0 erreur, 0 avertissement
- `npm test` → vert (nouveaux tests C1 inclus)

## L2b — Étape 3 logique (endpoints, stores, nettoyeurs, tests)

### Fichiers modifiés / ajoutés

| Fichier | Avant → Après | Raison |
|---|---|---|
| `src/core/utils/memberData.ts` | 0 → 32 | Registre nettoyeurs (register + clearMemberData) |
| `src/core/api/endpoints/bots.ts` | 65 → 119 | Types API.md (telegram_bot_id string\|number, username null), deleteBot → {deleted}, getBot |
| `src/core/api/endpoints/member.ts` | 29 → 68 | Uniquement /me (PATCH, delete/request, delete) ; quota retiré |
| `src/core/api/endpoints/quota.ts` | 1 → 17 | GET /quota dans son propre fichier (plus de ré-export) |
| `src/features/bots/store/botsStore.ts` | 66 → 276 | Single-flight, cache validé TTL 3 min, actions = remplacement fiche Worker, busy, clear + registre |
| `src/features/bots/store/associateStore.ts` | 51 → 197 | verify/confirm résultats explicites, jeton mémoire seule, AppState clear, anti double-soumission |
| `src/features/member/store/quotaStore.ts` | 44 → 110 | Single-flight, cache validé, usageRatio sans /0, registre |
| `src/features/member/store/memberStore.ts` | 0 → 137 | PATCH champs stricts, validation par champ, delete 2 temps, ACCOUNT_CLEANUP_PENDING |
| `src/features/auth/store/authStore.ts` | 132 → 181 | clearMemberData à signOut/ended/ACCOUNT_DISABLED ; export safeBoot |
| `src/features/bots/index.ts` | 1 → 3 | exports stores + types |
| `src/features/member/index.ts` | 1 → 3 | exports quota + member stores |
| `__tests__/session-c1.test.ts` | 334 → 353 | safeBoot → toBe(1) ; sérialisation après verify ; même rt sur 3 essais |
| `__tests__/step3-member-data.test.ts` | 0 → 411 | listBots, associate cas, single-flight/TTL/remplacement, quota, member, effacement, hors ligne |

### Constats
- Aucun écran, aucun style, aucune dépendance ajoutée.
- Jeton Telegram : mémoire uniquement (associateStore) ; effacé succès / reset / AppState background.
- Aucun plafond de bots hardcodé (BOT_LIMIT_REACHED renvoyé par le Worker).
- core/utils/memberData n'importe aucune feature.

### Non fait
- Écrans / navigation étape 3 (hors périmètre L2b).
- Création de bot et demandes (hors périmètre).
- Exécution locale jest (CI propriétaire).

### Preuve attendue CI
- `npm run typecheck` → 0 erreur
- `npm run lint` → 0 erreur, 0 avertissement
- `npm test` → vert (session-c1 + step3)

## L2c — Correctifs audit L2b (génération, single-flight muted, source membre)

### Fichiers modifiés

| Fichier | Avant → Après | Raison |
|---|---|---|
| `src/core/utils/memberData.ts` | 32 → 32 | Apostrophes commentaires sans antislash |
| `src/features/bots/store/botsStore.ts` | 277 → 196 | runBotAction, génération, muted:{id}:{bool}, <200 L |
| `src/features/member/store/quotaStore.ts` | 111 → 113 | génération anti-fuite |
| `src/features/member/store/memberStore.ts` | 141 → ~150 | génération, applySignedOut, sync authStore, imports fusionnés |
| `src/features/auth/store/authStore.ts` | 181 → ~175 | applySignedOut exporté, setMember |
| `src/features/bots/store/associateStore.ts` | 197 → ~200 | setToken reset preview, verify → duplicate |
| `__tests__/step3-member-data.test.ts` | 415 → 584 | génération, muted true/false, sync, applySignedOut |

### Fichiers à supprimer (parasites 1–3 octets)
- `src/features/auth/data/-`
- `src/features/bots/screens/&`
- `src/features/bots/store/-`
- `src/features/dashboard/screens/++`
- `src/features/member/store/&`

### Non fait
- Aucun écran / style ajouté.

### Preuve attendue CI
typecheck 0, lint 0, jest 100 % vert.
