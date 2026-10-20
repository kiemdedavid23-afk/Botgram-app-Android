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
