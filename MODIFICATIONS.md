# Partie Entreprise : refonte visuelle

## À SUPPRIMER du projet (code mort ou remplacé)
- `src/features/accounts/company/components/Primitives.tsx` : jamais importé, jetons inexistants (`gold`, `surface`, `rail`…), doublons de `ui.tsx`.
- `src/features/accounts/company/components/HeroCarousel.tsx` : remplacé par `HeroStats.tsx`.

## Fichiers créés
- `company/companyPalette.ts` : palette pure (surfaces, 7 couleurs de marque, teintes de bots, calcul de contraste).
- `company/components/HeroStats.tsx` : carte colorée, indicateur principal + 2 tuiles, tout visible sans défiler.
- `company/components/CompanyMark.tsx` : pastille d'initiales de l'entreprise.
- `company/components/BrandPicker.tsx` : choix de la couleur de marque.
- `store/brandStore.ts` : couleur choisie, gardée sur l'appareil (MMKV), par espace.
- `__tests__/company-brand.test.ts` : contrastes WCAG de toute la palette + store.

## Fichiers modifiés
- `company/companyTheme.ts` : thème branché sur la couleur de marque ; tailles de texte dans `companyMetrics`.
- `company/companyLogic.ts` : `botTintIndex`, `quotaNote`.
- `company/CompanyHeader.tsx`, `CompanyDashboardScreen.tsx`, `CompanyProfileScreen.tsx`.
- `company/components/ui.tsx`, `BotsCard.tsx`, `TeamCard.tsx`, `ActionsCard.tsx`.
- `team/components/teamPalette.ts` : ombre issue du thème.
- `__tests__/company-logic.test.ts` : tests de `botTintIndex` et `quotaNote`.

## Corrections par point
1. Code mort : voir la liste de suppression ci-dessus.
2. Contraste : texte secondaire `#5A5E7A` (≥ 4,5:1 sur tous les fonds), rouge `#C2352C`, texte du hero en blanc plein, tuiles sombres translucides. Garanti par test.
3. Identité : pastille d'initiales + nom dans l'en-tête ; 7 couleurs de marque (profil › « Couleur de l’entreprise »). Choix local à l'appareil : pas de champ côté Worker. Un vrai logo demande un champ `logo_url` + un envoi d'image côté API.
4. Hero : plus de carrousel ; envois en grand, « Bots en ligne » et « Équipe » en tuiles (touchables). La jauge passe à l'orange puis au rouge près de la limite (`quotaLevel`).
5. Raccourcis : retrait de « Équipe » et « Gestion des bots » (déjà accessibles par leurs cartes) ; restent Inviter, Mon profil, Lier un bot.
6. Tailles : plus aucune taille déduite d'une marge ; `headerBtn` = 40 réellement utilisé.
- Mode sombre : ombre à 0,5 ; accent éclairci ; hero toujours en dégradé foncé avec texte blanc ; texte des boutons pleins de l'écran Équipe devenu sombre sur l'accent clair (lisible).
- Bots : photo du bot si elle existe, sinon initiale sur une teinte stable propre à chaque bot.

## Non vérifié ici
Pas de `node_modules` dans l'archive : je n'ai pas pu lancer `jest`, `tsc` complet ni l'app. Vérifiés : syntaxe de tous les fichiers, et les contrastes avec le vrai code de `companyPalette.ts`. Lance `npm test` et `npx tsc --noEmit` chez toi.
