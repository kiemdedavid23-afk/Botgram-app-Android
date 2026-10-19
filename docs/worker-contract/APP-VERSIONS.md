# Application mobile : versions, mises à jour et sessions (v15.2)

Ce document est le contrat entre le Worker et **deux clients** : l'application mobile (Android d'abord, React Native) et la
**compilation** (GitHub Action qui produit l'APK). Il complète `API.md`. Le site web n'est concerné par rien ici : sans en-têtes
`X-App-*`, une requête n'est jamais contrôlée ni bloquée.

## 1. Principe

- Le Worker garde un **registre des versions** (table `app_releases`) : une ligne par plateforme, **canal** et build.
- L'application **n'interroge pas le registre à chaque ouverture**. Elle envoie son identité dans les en-têtes des requêtes qu'elle
  fait déjà, et le Worker répond par un en-tête `X-App-Update` : aucune requête de plus, aucune lecture de base de plus (le registre
  est gardé 5 minutes en mémoire de l'isolat).
- Une nouvelle version est annoncée de trois façons : l'en-tête des réponses, une notification (sujet Firebase), et une route de
  vérification explicite (`GET /app/updates`) pour l'écran de connexion ou le bouton « Rechercher une mise à jour ».
- Une mise à jour est **obligatoire** quand le build de l'application est inférieur au **minimum supporté de son canal**. Le Worker
  répond alors 426 sur les routes de membre.

### Canaux

Un canal est un mode de distribution. Chaque build est publié **par canal**, car une boutique valide plus tard que GitHub :
l'obligation d'une mise à jour n'existe dans un canal que lorsque ce build y est disponible.

| Canal | Distribution | `download_url` | `sha256` et `size_bytes` |
|---|---|---|---|
| `direct` | fichier APK hébergé (GitHub Releases) | le fichier, dont l'adresse commence par `RELEASE_URL_PREFIX` | obligatoires |
| `beta` | idem, pour des testeurs | idem | obligatoires |
| `palm`, `play`, … (tout autre nom) | boutique | la fiche de l'application dans la boutique (https) | facultatifs |

Le canal est **fixé à la compilation** : une application installée depuis une boutique ne se met pas à jour avec un APK du canal
`direct` (la signature serait différente). Elle envoie toujours le canal avec lequel elle a été compilée.

## 2. Identité envoyée par l'application

Dans **toutes** ses requêtes vers le Worker :

| En-tête | Valeur | Obligatoire |
|---|---|---|
| `X-App-Platform` | `android` (ou `ios`) | oui |
| `X-App-Channel` | `direct`, `beta`, `palm`, `play`… : 2 à 24 caractères parmi `a-z 0-9 _ -` | oui |
| `X-App-Build` | le `versionCode` Android : entier de 1 à 2147483647, qui **augmente à chaque version** | oui |
| `X-App-Version` | nom affiché, `1.4.0` | non |

Si l'un des trois premiers manque ou est mal formé, la requête est traitée comme venant du site web (aucune erreur). Les en-têtes sont
autorisés en CORS ; `X-App-Update`, `X-App-Latest-Build` et `X-App-Min-Build` sont lisibles côté navigateur.

La version est mémorisée sur la **session** : à la connexion, à chaque renouvellement de jeton, et à chaque appel de
`POST /push/register`. **L'application appelle `/push/register` à chaque démarrage** (le jeton Firebase peut changer, et c'est ainsi
que le Worker apprend la nouvelle version juste après une mise à jour). Une application sans permission de notifications doit quand même
envoyer ses en-têtes : la version est connue par le renouvellement des jetons.

## 3. Ce que répond le Worker

Sur les routes de membre (session) et sur `POST /auth/refresh`, quand l'identité est présente :

| En-tête de réponse | Valeur |
|---|---|
| `X-App-Update` | `none` (à jour), `optional` (un build plus récent existe), `required` (build sous le minimum) |
| `X-App-Latest-Build` | dernier build publié dans le canal (absent si le canal n'a aucune version) |
| `X-App-Min-Build` | minimum supporté du canal |

**`optional`** : afficher une bannière discrète « Mise à jour disponible » (au plus une fois par jour), avec un bouton qui ouvre l'écran
de mise à jour. **`required`** : voir ci-dessous.

### 426 `UPGRADE_REQUIRED`

Sur toute route de membre, un build sous le minimum reçoit :

```json
{ "ok": false,
  "error": { "code": "UPGRADE_REQUIRED", "message": "…",
    "details": { "reason": "app_outdated", "platform": "android", "channel": "direct", "build": 5,
                 "min_supported_code": 8,
                 "latest": { "version_code": 10, "version_name": "1.10.0", "download_url": "https://…", "sha256": "…", "size_bytes": 41234567, "notes": "…" } } },
  "request_id": "…" }
```

L'application remplace alors tout l'écran par l'écran de mise à jour obligatoire (sans quitter la session). Ne sont **jamais** bloqués :
les routes publiques (`/health`, `/auth/code/*`, `/auth/refresh`, `/app/updates`), les webhooks, la déconnexion (`/auth/logout`,
`/auth/logout-all`) et `/push/unregister`. Le 401 passe avant le 426 : un jeton invalide ne révèle rien.

## 4. Route de vérification

`GET /v1/app/updates?platform=android&channel=direct&build=12` — publique, 30 appels par minute et par IP.

```json
{ "ok": true, "data": { "update": "optional", "platform": "android", "channel": "direct", "build": 12,
    "min_supported_code": 8,
    "latest": { "version_code": 14, "version_name": "1.14.0", "download_url": "https://github.com/…/botgram-v1.14.0.apk",
                "sha256": "…", "size_bytes": 41234567, "notes": "Corrections.", "published_at": 1760000000000 } } }
```

`latest` vaut `null` si le canal n'a encore aucune version (`update: "none"`). **À appeler** : sur l'écran de connexion (pas encore de
session, donc pas d'en-tête de réponse), après un 426, et sur demande de l'utilisateur. **Pas à chaque ouverture.**

## 5. Notification d'une nouvelle version

Quand la compilation demande `notify`, le Worker envoie **un seul** message Firebase au **sujet** du canal :

- sujet : `app-update-<platform>-<channel>`, par exemple `app-update-android-direct` ;
- l'application **s'abonne** à son sujet (côté client, avec le SDK Firebase) après la première connexion, et se désabonne à la déconnexion ;
- `data` : `type: "app_update"`, `platform`, `channel`, `version_code`, `version_name`, `min_supported_code` ;
- titre « Mise à jour disponible », corps « Botgram 1.14.0 est disponible. » ; canal de notification Android **`updates`** (à créer
  dans l'application, importance normale).

Le sujet concerne tous les appareils du canal, y compris à jour : l'application **ignore** le message si son build est `≥ version_code`.
Elle compare aussi son build à `min_supported_code` pour savoir si la mise à jour est obligatoire pour elle. Une notification perdue ne
coûte rien : l'en-tête `X-App-Update` rattrape au prochain échange.

## 6. Installer la mise à jour (canal `direct`)

1. Télécharger `download_url` (HTTPS uniquement), dans le dossier privé de l'application.
2. Vérifier la **taille** puis le **SHA-256** (insensible à la casse) avec ceux de la réponse du Worker. Différence : supprimer le fichier,
   ne rien installer, afficher une erreur.
3. Lancer l'installation avec l'installateur d'Android (`FileProvider` + `ACTION_VIEW`, ou `PackageInstaller`). Android refuse tout
   fichier **signé avec une autre clé** que l'application installée : c'est la protection finale contre un faux fichier.
4. Prévoir l'autorisation « Installer des applications inconnues » (`REQUEST_INSTALL_PACKAGES`) : expliquer à l'utilisateur où l'activer.

Canal boutique : ouvrir `download_url` (la fiche de la boutique) ; ne jamais télécharger de fichier.

## 7. Sessions : règles imposées à l'application

Durées : **jeton d'accès 2 heures**, **session 180 jours** (échéance absolue, jamais repoussée). Un membre actif reste connecté sans e-mail ;
un nouveau code n'est demandé que sur un nouvel appareil, après 180 jours, ou après révocation.

L'application doit :

1. **Garder les jetons dans le stockage sécurisé** (Keystore Android, par ex. `react-native-keychain`), jamais en mémoire seule ni dans le
   stockage ordinaire : un redémarrage du téléphone ou la fin du processus ne déconnecte pas. Exclure ce stockage de la sauvegarde
   automatique d'Android (`android:allowBackup="false"` ou règle d'exclusion), pour qu'un jeton ne soit pas restauré sur un autre téléphone.
2. **Utiliser le mode corps** (`X-Token-Mode: body` sur `/auth/code/verify` et `/auth/refresh`) et `Authorization: Bearer <access_token>`.
3. **Renouveler** sur un 401 `error.details.reason = "access_expired"` (ou un peu avant l'échéance `access_expires_in`), puis rejouer la requête.
4. **Écrire le nouveau jeton de renouvellement dans le stockage sécurisé avant de s'en servir**, puis seulement ensuite le jeton d'accès.
5. **Un seul renouvellement à la fois** : si plusieurs requêtes échouent en même temps avec `access_expired`, une seule appelle
   `/auth/refresh` et les autres attendent son résultat.
6. **Ne jamais retourner à la connexion sur une simple erreur réseau**, un timeout ou une réponse 5xx. Seuls `revoked`, `session_expired`,
   `invalid` et `refresh_reuse` (401 de `/auth/refresh`) terminent la session.

**Réponse de renouvellement perdue** (réseau coupé, application tuée) : l'application ne possède que l'ancien jeton de renouvellement.
Le rejouer :
- dans les 10 premières secondes : 401 `refresh_race` (avec `details.retry_after`, en secondes). Relire le stockage (une autre instance a
  peut-être déjà fini), sinon attendre ce délai et rejouer le **même** jeton ;
- jusqu'à **10 minutes** après le renouvellement : le Worker émet une nouvelle paire de jetons ; l'ancien jeton reste rejouable pendant
  cette fenêtre, qui ne se prolonge pas ;
- au-delà : le Worker considère que le jeton a été volé, révoque la session (`refresh_reuse`) et l'application revient à la connexion.

## 8. Contrat de la compilation (GitHub Action → Worker)

À chaque compilation réussie : la Release GitHub est créée avec l'APK, puis le Worker est prévenu.

`POST /v1/ci/releases` — en-tête `Authorization: Bearer <RELEASE_PUBLISH_TOKEN>`, corps JSON :

| Champ | Type | Règle |
|---|---|---|
| `platform` | texte | `android` ou `ios` |
| `channel` | texte | `direct`, `beta`, ou une boutique |
| `version_code` | entier | 1 à 2147483647, **doit augmenter** à chaque build |
| `version_name` | texte | 1 à 32 caractères : lettres, chiffres, `. + _ -` |
| `download_url` | texte | https ; pour `direct` et `beta` : commence par `RELEASE_URL_PREFIX` |
| `sha256` | texte | 64 hexadécimaux ; **obligatoire** pour `direct` et `beta` |
| `size_bytes` | entier | **obligatoire** pour `direct` et `beta` |
| `notes` | texte | jusqu'à 4000 caractères |
| `min_supported_code` | entier | 0 à `version_code` ; `0` ou absent = aucune exigence. **Ce minimum s'applique à tout le canal** tant que cette version est publiée |
| `commit_sha` | texte | 7 à 64 hexadécimaux |
| `notify` | booléen | annonce par notification (sujet du canal) si cette ligne devient la dernière version |

Réponses : **201** `{ release, created: true, is_latest }` ; **200** `created: false` si le même contenu est renvoyé (rejouable sans risque) ;
**409** `CONFLICT` (`details.reason`: `release_exists_different` ou `release_withdrawn`) si ce build existe déjà autrement ; **400** avec
`details.fields` (`outside_allowed_prefix`, `https_required`, `prefix_not_configured`, `required`, `bad_format`, …) ; **401** jeton absent ou faux ;
**404** si le Worker n'a pas de `RELEASE_PUBLISH_TOKEN` ; **429** au-delà de 30 appels par 15 minutes et par IP.

Le Worker **n'a pas besoin de télécharger l'APK** : il enregistre l'adresse et l'empreinte calculées par la compilation. Comme il ne
peut pas les vérifier, il restreint l'adresse au préfixe `RELEASE_URL_PREFIX` : un jeton de compilation volé ne permet donc pas de
faire télécharger un fichier hébergé ailleurs, et Android refuse de toute façon un fichier signé par une autre clé.

**Version obligatoire** : la compilation envoie `min_supported_code` égal à son propre `version_code` (à déclencher exprès, par exemple avec
une case « mise à jour obligatoire » au lancement manuel). Retirer ensuite ce build (route d'administration) supprime l'obligation.

Un exemple complet de workflow se trouve dans `docs/examples/android-release.yml` (pour le dépôt de **l'application**, pas celui du
Worker). **Le dépôt de l'application (ou au moins ses Releases) doit être public** : le téléchargement d'un APK depuis une Release d'un
dépôt privé exige une authentification, que l'application n'a pas.

## 9. Administration 👑

| Route | Rôle |
|---|---|
| `GET /admin/app-releases` | liste (`platform?`, `channel?`, `limit?` 1–100, défaut 50), plus récentes d'abord |
| `POST /admin/app-releases` | ajoute une ligne à la main, même corps que la compilation (ex. un build devenu disponible chez Palm Store : canal `palm`) |
| `POST /admin/app-releases/:id/withdraw` | retire un build : plus proposé, et le minimum qu'il portait disparaît (404 inconnu ; `withdrawn: false` s'il l'était déjà) |
| `GET /admin/app-stats` | sessions actives par version : `{ platform, channel, build, version, sessions, members, update }` |

Un build retiré ne peut pas être republié tel quel : publier un nouveau build. Les publications et retraits sont inscrits dans l'audit
(`app_release_published`, `app_release_withdrawn`).

## 10. Mise en place côté Worker

1. **Avant** de déployer la v15.2 : coller `upgrade/D-v15.1-vers-v15.2.sql` dans la Console D1, **une seule fois** (colonnes de version sur les
   sessions, table `app_releases`). Sans cela, la connexion échoue (les sessions écrivent les nouvelles colonnes). Base neuve : `migrations/0006_app_versions.sql`.
2. Secret `RELEASE_PUBLISH_TOKEN` : texte aléatoire de 32 caractères ou plus, posé **dans Cloudflare** (secret du Worker) **et** dans les
   secrets GitHub du dépôt de l'application (même nom).
3. Variable `RELEASE_URL_PREFIX` dans `wrangler.toml` : `https://github.com/<compte>/<dépôt-de-l-application>/releases/download/`.
4. Si le secret n'est pas posé, la route de publication n'existe pas (404) et le reste fonctionne ; sans préfixe, seuls les canaux boutique
   sont acceptés.
