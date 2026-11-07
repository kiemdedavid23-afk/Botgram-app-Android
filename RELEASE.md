# Publier la version 2.0 (dépôt privé)

Le numérotage est automatique : ne rien régler à la main dans le code.

- **Build (versionCode)** = numéro d'exécution du workflow « Release Android » du dépôt privé : il augmente tout seul, donc toujours supérieur au précédent.
- **Nom de version** = lu depuis le tag `vX.Y.Z.release.N`. Sans tag, le workflow prend le dernier tag et ajoute 1 au `N` (au-delà de 10, il passe au `Z` suivant).
- **Signature** : clé de publication fournie par les secrets du dépôt privé (`ANDROID_KEYSTORE_*`) ; le workflow refuse un APK signé avec la clé de debug.
- **Mise à jour forcée** : case « force_update » au lancement du workflow ; le build devient alors le minimum accepté par le Worker (`min_supported_code`).

## 1. Avant de publier (dépôt public)

- [ ] Lancer « Test APK » (dépôt public), installer l'APK de test et parcourir : inscription des 3 types, tableau de bord et profil de chaque type, Équipe (inviter, rôle, retrait, transfert), invité lecteur (rien d'écrit), invité agent (assigner, ses messages seulement), quitter l'entreprise
- [ ] Un compte particulier existant se connecte et retrouve ses bots
- [ ] Coller les sorties typecheck, lint, tests dans les sections « Preuves CI » de `LIVRAISONS.md`
- [ ] Le Worker v16.14.7 (ou plus récent) est déployé

## 2. Synchroniser vers le privé

Lancer « Sync vers le dépôt privé » (d'abord avec `dry_run`). Les workflows du privé ne sont pas touchés.

## 3. Choisir le nom de version 2.0

Le dernier tag est de la forme `v1.x.y.release.N`. Pour passer à 2.0.0, créer le premier tag de la nouvelle série dans le privé :

```
git tag v2.0.0.release.1
git push origin v2.0.0.release.1
```

Le push du tag lance le workflow (nom de version `2.0.0.release.1`). Les publications suivantes, lancées par « Run workflow », donneront `2.0.0.release.2`, `.3`…

Pour ce premier lancement, utiliser le bouton « Run workflow » est impossible si l'on veut forcer le nom ; avec un tag, `force_update` vaut `false` (entrée absente). Deux façons de forcer la mise à jour :
- lancer d'abord par tag, puis relancer « Run workflow » avec `force_update` coché (nom `2.0.0.release.2`) ;
- ou forcer côté Worker, après coup, avec le build indiqué dans la sortie du workflow.

## 4. Vérifier

- [ ] Le workflow est vert ; l'APK apparaît dans les Releases du dépôt public (`build-<numéro>`)
- [ ] « Register the version in the Worker » affiche la version enregistrée
- [ ] Une ancienne version affiche l'écran de mise à jour ; la nouvelle passe
- [ ] Le workflow publie l'APK avant d'enregistrer la version : une mise à jour forcée n'est donc jamais active sans APK téléchargeable

## Points d'attention

- La collaboration est filtrée côté app sur les conversations déjà chargées ; le filtre serveur `assigned=` reste possible plus tard.
- Les deux workflows utilisent le paquet `app.botsgram.dsi` : cohérent avec `android/app/build.gradle`.
