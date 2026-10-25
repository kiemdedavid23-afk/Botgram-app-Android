# LIVRAISONS — Botgram App (cumulatif)

## Dépendance blob-util
- `react-native-blob-util@0.25.1` exact ; fs + `android.actionViewIntent` uniquement dans `mediaFiles.ts`
- Impact android/ : FileProvider fusionné par autolinking ; aucune permission storage ajoutée

## Correction session / R9 / L6b partiel
1. `authedHttpBinary` — même refresh 401 / 426 / fin de session que `authedHttp`
2. `http.ts` ≤ 300 + `executeFetch` unique ; `http.binary.ts` sans second `fetch`
3. `openMediaFile` via `actionViewIntent`
4. Album : tous les éléments (grille, métrique colonnes)
5. Auto-DL photo ≤ 2 Mo ; inflight partagé ; AbortSignal au démontage
6. `registerMediaStorageCleaner` retourne la promesse ; `clearAll` supprime le dossier

### Écarts
- Pas de chiffrement disque médias (étape 6 / 13.11)
- Pas de L6c/L6d

### Preuves CI
*(Coller typecheck / lint / jest.)*


## Correction CI (journal)

### 3 faux positifs `fetch` (guard R1)
Avant : le test matchait `\bfetch\(` → capturait aussi `NetInfo.fetch()`.

| Fichier | Ligne | Contenu réel |
|---------|-------|--------------|
| `src/features/auth/store/authStore.ts` | ~80 | `NetInfo.fetch()` |
| `src/features/thread/components/MediaFile.tsx` | ~43 | `NetInfo.fetch()` |
| `src/features/thread/components/MediaPhoto.tsx` | ~77 | `NetInfo.fetch()` |

Après : regex `(?<![.\w])fetch\s*\(` — seul le `fetch(` global de `http.ts` compte. **Aucun** appel HTTP hors `http.ts`.

### Autres
1. MediaPhoto : `bootstrap` / `runDownload` en `useCallback`, deps complètes
2. `http.ts` / `http.binary.ts` : try/catch autour de `text()` / `arrayBuffer()` → `network_error`
3. media-album : `await act(async () => create(...))`

### Preuves CI
*(Coller typecheck / lint / jest.)*
