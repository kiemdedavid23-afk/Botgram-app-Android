# Botgram — contrat API V1

Base : `https://<worker>/v1`. Toutes les réponses sont du JSON.

```json
{ "ok": true,  "data": { }, "request_id": "uuid" }
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { } }, "request_id": "uuid" }
```

Le corps est limité à 100 Ko (webhook : 512 Ko). Les champs inconnus sont refusés (`VALIDATION_ERROR`,
`details.fields.<champ> = "unknown_field"`). Les listes sont paginées : `?limit=1..50` (défaut 20) et
`?cursor=` (opaque), du plus récent au plus ancien ; la réponse contient `items` et `next_cursor` (`null` à la fin).

## Authentification côté frontend

Deux modes, au choix du frontend :

| Mode | Comment | Quand |
|---|---|---|
| Cookies (défaut) | `fetch(url, { credentials: 'include' })`. Cookies `__Host-bg_at` (2 h) et `__Host-bg_rt`, HttpOnly, Secure ; SameSite `Lax` sur le même site, `None` + `Partitioned` entre sites différents (`COOKIE_SAMESITE=auto`). | Frontend et Worker sur le même site (ex. `app.exemple.com` et `api.exemple.com`). |
| Corps | Ajouter l'en-tête `X-Token-Mode: body` à `code/verify` et `refresh`. Les jetons sont dans le JSON (`access_token`, `refresh_token`, `access_expires_in`, `session_expires_at`) ; envoyer ensuite `Authorization: Bearer <access_token>`. | Frontend et Worker sur des sites différents (`frontend.example` et `worker.example`). |

Renouvellement : quand une réponse 401 porte `error.details.reason = "access_expired"`, appeler
`POST /auth/refresh` (corps : `{ "refresh_token": "…" }` en mode corps, rien en mode cookie), puis rejouer la requête.
Le jeton de renouvellement est à usage unique : conserver le nouveau. `session_expired` ou `revoked` : nouvelle connexion.

## Connexion par code e-mail (comme Telegram, avec l'adresse à la place du numéro)

Il n'y a **ni mot de passe, ni page d'inscription séparée** : connexion et inscription sont le même parcours en deux étapes.

1. `POST /auth/code/request` `{ email, ui_language? }` → **202** `{ requested: true, expires_in: 360, code_length: 6 }`.
   Un e-mail contenant un code à 6 chiffres part (le sujet le contient aussi). La réponse est **identique que l'adresse ait un
   compte ou non**. Affichez ensuite un champ de saisie du code et un compte à rebours de 6 minutes.
2. `POST /auth/code/verify` `{ email, code, display_name?, country?, usage?, phone?, organization? }` :
   - compte existant, code bon → **200** `{ member, is_new: false, … jetons … }` ;
   - adresse inconnue, code bon, profil **incomplet** → **200** `{ needs_profile: true, missing: ["display_name", …] }`. Le code **n'est pas
     consommé** : affichez le formulaire d'inscription, puis renvoyez la même requête avec tous les champs, dans les 6 minutes du code ;
   - adresse inconnue, code bon, profil complet → **201** `{ member, is_new: true, … jetons … }` (le code prouve l'adresse :
     `member.email_verified` vaut `true`) ; un champ invalide → **400** `VALIDATION_ERROR` (`details.fields`), code toujours utilisable ;
   - code faux, expiré, déjà utilisé ou brûlé → **400** `CODE_INVALID`, avec `details.reason` : `invalid` (réessayer),
     `too_many_attempts` (5 essais faux : redemander un code) ou `expired` (redemander un code).

Règles : un code vaut 6 minutes, un seul usage, 5 essais ; redemander un code **remplace** le précédent. Une adresse ne peut pas
redemander avant 30 secondes (429 `RATE_LIMITED` avec `Retry-After`, sauf si le dernier code a déjà servi), ni plus de 3 fois par
heure. Par IP : 10 demandes et 20 codes faux par 15 minutes, 5 créations de compte par 15 minutes. Le Worker plafonne aussi le
nombre total d'e-mails par jour (`EMAIL_DAILY_LIMIT`, 90 par défaut) : au-delà, **503** `EMAIL_QUOTA_EXCEEDED` avec `Retry-After`
(message à afficher : « envoi momentanément indisponible, réessayez plus tard »).

Une session dure 180 jours (échéance absolue) avec un jeton d'accès de 2 heures, et se renouvelle sans e-mail (`/auth/refresh`) : un code n'est nécessaire que sur un **nouvel appareil**
ou après 180 jours. Réponse de renouvellement perdue : l'ancien jeton rejoué dans les 10 s reçoit 401 `refresh_race` (`details.retry_after`), jusqu'à 10 min il reçoit une nouvelle paire, au-delà la session est révoquée (`refresh_reuse`). Détails et règles pour l'application : `APP-VERSIONS.md` §7. Si l'envoi échoue côté Google, l'utilisateur redemande un code (au bout de 30 s).

**Appareils** : `GET /auth/sessions` liste les sessions actives (`id`, `device` comme « Chrome · Android », `created_at`,
`last_active_at` à ±15 min près, `expires_at`, `current`, `app` : `{ platform, channel, build, version }` ou `null`) ; `DELETE /auth/sessions/:id` déconnecte un appareil.

## Routes

Légende : 🔓 publique · 🔑 session · ✉️ session + e-mail vérifié · 👑 administrateur.

### Santé
- 🔓 `GET /health` → `{ status, environment, token_mode }` — `token_mode` est le mode d'authentification conseillé au frontend : `cookie` (même site que le Worker) ou `body` (sites différents : `frontend.example` et `worker.example`, par exemple).

### Comptes
| Route | Accès | Corps | Réponse |
|---|---|---|---|
| `POST /auth/code/request` | 🔓 | `email`, `ui_language?` (`fr`\|`en`) | 202 `{ requested, expires_in, code_length }` |
| `POST /auth/code/verify` | 🔓 | `email`, `code` (6 chiffres), profil d'inscription (voir plus bas) | 200 / 201 `{ member, is_new, … }` ou 200 `{ needs_profile, missing }` |
| `POST /auth/refresh` | 🔓 | `refresh_token?` (mode corps) | 200 nouveaux jetons |
| `POST /auth/logout` | 🔑 | — | révoque la session |
| `POST /auth/logout-all` | 🔑 | — | révoque toutes les sessions |
| `GET /auth/me` | 🔑 | — | `{ member }` |
| `GET /auth/sessions` | 🔑 | — | `{ items: [{ id, device, created_at, last_active_at, expires_at, current, app }] }` |
| `DELETE /auth/sessions/:id` | 🔑 | — | `{ revoked: true }` ; 404 si ce n'est pas un de vos appareils |

`member` : `id, email, email_verified, display_name, role, status, country, usage, phone, organization, selected_bot_id, created_at`.

**Profil d'inscription** (le Worker ne contrôle que la forme ; les listes vivent dans le frontend) :

| Champ | Requis à l'inscription | Règle |
|---|---|---|
| `display_name` | oui | 1–80 caractères |
| `country` | oui | code ISO 3166-1 à 2 lettres (`BF`), enregistré en majuscules |
| `usage` | oui | libellé court libre, 1–40 caractères (liste proposée par le frontend) |
| `phone` | oui | international : `+226 70 12 34 56` accepté, enregistré `+22670123456` (7–15 chiffres, pas de 0 après le +) |
| `organization` | non | 0–80 caractères ; `""` efface |

Langue d'interface, fuseau horaire, thème et photo de profil ne sont **pas** stockés : le frontend les garde. `ui_language` n'existe plus que
comme paramètre de `/auth/code/request`, pour choisir la langue de l'e-mail.

### Profil
- 🔑 `PATCH /me` — `display_name?`, `country?`, `usage?`, `phone?`, `organization?` (mêmes règles) → `{ member }`
- 🔑 `POST /me/delete/request` — `ui_language?` → 202 `{ requested, expires_in, code_length }` : envoie un code à l'adresse du compte (adresse vérifiée exigée, 403 sinon). L'e-mail a le même texte que le code de connexion : le frontend indique à l'utilisateur de quoi il s'agit.
- 🔑 `POST /me/delete` — `{ code }` → 200 `{ deleted: true }` + cookies effacés : **supprime le compte et tout ce qui s'y rattache** (bots déconnectés et webhooks retirés, jetons, conversations, messages, photos de contacts dans Drive, sessions, appareils notifiés). Irréversible. 400 `CODE_INVALID` (rien n'est effacé) ; 409 `ACCOUNT_CLEANUP_PENDING` si Drive est injoignable (le compte reste, le même code reste valable : réessayer) ; 502/503 si Telegram est injoignable (idem). L'adresse peut ensuite se réinscrire.
- 🔑 `GET /quota` → `{ day, limit: 165, used, remaining, resets_at }`

### Bots
| Route | Accès | Corps | Réponse |
|---|---|---|---|
| `GET /bots` | 🔑 | — | `{ bots: [bot] }` (fiches déconnectées comprises) |
| `POST /bots/preview-token` | ✉️ | `token` | `telegram_bot_id, username, name, webhook_set, webhook_is_botgram, replace_required, already_linked` |
| `POST /bots` | ✉️ | `token`, `confirm_replace_webhook?` | 201 `{ bot }` |
| `GET /bots/:id` | 🔑 | — | `{ bot }` |
| `PATCH /bots/:id` | 🔑 | `muted` (booléen, obligatoire) | `{ bot }` — sourdine : plus de notification push pour ce bot ; les messages arrivent et comptent comme non lus |
| `POST /bots/:id/select` | 🔑 | — | `{ bot }` — ne coupe pas l'autre connexion |
| `POST /bots/:id/retry-webhook` | ✉️ | — | `{ bot }` — 10 appels par heure et par membre (429 au-delà), comme `resync-webhook` |
| `POST /bots/:id/resync-webhook` | ✉️ | — | `{ bot }` — bot `connected` : repose le webhook avec la liste d'événements à jour (nécessaire pour recevoir les réactions ; `MESSAGE-ACTIONS.md` §4) |
| `POST /bots/:id/disconnect` | ✉️ | `drop_pending_updates?` (défaut `false`) | `{ bot }` |
| `DELETE /bots/:id` | ✉️ | — | `{ deleted: true }` — seulement si déconnecté ; 409 `BOT_CLEANUP_PENDING` tant qu'une photo de contact ne peut pas être supprimée de Drive |
| `GET /bots/:id/photo` | ✉️ | — | **l'image** (pas du JSON) ; 404 `details.reason: "no_photo"` si le bot n'a pas de photo |
| `POST /bots/:id/files/my-profile-photo` | ✉️ | multipart, champ `file` (**JPEG**, 5 Mo max) | `{ updated: true }` — 10 par heure et par membre (avec la suppression) |
| `DELETE /bots/:id/files/my-profile-photo` | ✉️ | — | `{ removed: true }` |

**Photo du bot** (`GET /bots/:id/photo`) : lue chez Telegram à chaque expiration du cache (`getUserProfilePhotos` sur l'identifiant du
bot lui-même), jamais copiée dans Drive. Une balise `<img>` n'envoie pas le jeton : le frontend la lit avec `fetch()` (en-tête
`Authorization` ou cookie), puis `URL.createObjectURL(blob)`, et garde le résultat en local (IndexedDB). En-tête `Cache-Control: private,
max-age=3600`. Côté serveur, un cache Cloudflare d'une heure évite d'appeler Telegram ; **il ne fonctionne que sur un domaine personnalisé,
pas sur une adresse `worker.example`** (sans lui : cache du navigateur seulement, et 20 lectures par minute et par membre qui appellent Telegram).
Changer ou supprimer la photo vide ce cache. Telegram n'accepte que l'envoi d'un fichier : un `file_id` ou une adresse sont refusés,
d'où le multipart ; le frontend convertit en JPEG (canvas, qualité 0,9) avant l'envoi.

`bot` : `id, telegram_bot_id, username, name, status, selected, muted, created_at, connected_at, disconnected_at`.
`status` : `pending`, `connected`, `webhook_error`, `token_invalid`, `disconnected`. Le jeton, le secret du webhook et
l'URL du webhook ne sont **jamais** renvoyés.

### Non lus, mises à jour et notifications
| Route | Accès | Corps | Réponse |
|---|---|---|---|
| `GET /updates?since=<ms>` | 🔑 | — | `{ server_time, conversations: [conversation], unread: { <bot_id>: n }, has_more }` — tous les bots connectés du membre ; 60 appels par minute |
| `POST /conversations/:id/read` | 🔑 | — | `{ unread_count: 0 }` |
| `POST /push/register` | 🔑 | `token` (jeton FCM), `platform?` (`fcm`), `device?` (≤ 80) | `{ registered: true }` — 5 appareils au plus par membre ; 30 par heure |
| `POST /push/unregister` | 🔑 | `token` | `{ removed: bool }` — à appeler avant la déconnexion |

Un appareil enregistré est lié à **la session** qui l'a enregistré : déconnexion, déconnexion de tous les appareils, appareil retiré de la liste (`DELETE /auth/sessions/:id`) ou session volée détectée suppriment son jeton ; plus aucune notification n'arrive sur cet appareil. Un jeton réenregistré après une nouvelle connexion passe à la nouvelle session.

`conversation` porte maintenant `unread_count`. **`/updates`** : passer `since` = le `server_time` de la réponse précédente (0 ou absent la première
fois) ; les conversations renvoyées remplacent celles du frontend (par `id`) et sont à remonter en tête de liste ; `has_more: true` (plus de 50
changements) = recharger les listes. Un même changement peut être renvoyé deux fois : c'est voulu, la fusion par `id` est sans risque.
Fonctionnement des notifications et mise en place Firebase : `PUSH.md`.

### Conversations et messages
| Route | Accès | Corps / réponse |
|---|---|---|
| `GET /bots/:id/conversations` | 🔑 | page de `{ id, bot_id, chat_type, title, username, last_message_at, created_at, last_message_text }` |
| `GET /conversations/:id` | 🔑 | `{ conversation }` |
| `GET /conversations/:id/messages` | 🔑 | page de messages |
| `POST /conversations/:id/messages` | ✉️ | corps `{ text (1–4096), parse_mode?, buttons?, client_message_id?, reply_to? }` → 201 `{ message }` (200 si `client_message_id` déjà vu) |
| `PATCH /messages/:id` | ✉️ | corps `{ text?, parse_mode?, buttons? }` (au moins `text` ou `buttons`) → 200 `{ message, edited }` : modifie le texte, la légende ou le clavier d'un message envoyé (voir ci-dessous) |
| `DELETE /messages/:id` | ✉️ | sans corps → 200 `{ deleted, telegram }` : supprime un message sortant (voir ci-dessous) |
| `POST /messages/:id/forward` · `/copy` | ✉️ | corps `{ target_conversation_id, client_message_id?, buttons? (copie) }` → 201 `{ message }` : transfère / copie un message vers une autre conversation **du même bot** (1 unité de quota) |
| `PUT` · `DELETE /messages/:id/reaction` | ✉️ | `{ emoji }` · sans corps → 200 `{ message }` : réaction du bot (une seule par message) |
| `POST` · `DELETE /messages/:id/pin` | ✉️ | `{ notify? }` · sans corps → 200 `{ message }` : épingle / désépingle le message **dans Telegram** |
| `POST /messages/:id/retry` | ✉️ | « Réessayer » : relance un **texte** resté `queued`. Sans corps. 200 `{ message, retried }` (voir ci-dessous) |
| `GET /messages/:id/attachment` | 🔑 | flux du fichier (téléchargé chez Telegram à la demande) |

`message` : `id, conversation_id, direction (in|out), kind (text|photo|document|callback_query|other), text, parse_mode ("HTML", "MarkdownV2" ou null), buttons (clavier inline : lignes de boutons, ou null — voir `BUTTONS.md`), callback (clics seulement : `{ data, label }`), forwarded_from (id Botgram du message source d'un transfert, ou null), reaction (réaction du bot, ou null), reactions (`[{ emoji, count }]` des utilisateurs), pinned_at (épinglé dans Telegram par Botgram, ou null) — voir `MESSAGE-ACTIONS.md`, status, error_code,
telegram_message_id, attachment { name, mime, size } | null, created_at, sent_at, edited_at, expires_at`.
Pour un message sortant (`direction: "out"`) s'ajoutent `retryable` (booléen : afficher le bouton « Réessayer ») et `retry_at`
(horodatage en ms : date avant laquelle le réessai est refusé ; `null` si le message n'est pas `queued`).

`status` d'un envoi :
- `sent` : Telegram a accepté (il a rendu un `message_id`) ;
- `queued` : échec temporaire de Telegram (429, 5xx) sur un **texte**. Rien ne le renvoie automatiquement : `retryable` vaut
  `true` et le membre appuie sur « Réessayer » (`POST /messages/:id/retry`) à partir de `retry_at` (1 min après le premier
  échec, 5 min après le deuxième, 15 min après le troisième, ou le délai exigé par Telegram s'il est plus long) ;
  après 3 réessais sans succès, le message passe en `failed` ;
- `failed` : refus définitif, voir `error_code` (`blocked`, `chat_not_found`, `bad_request`, `forbidden`, `token_invalid`,
  `rate_limited`, `telegram_unavailable`, `bot_disconnected`, `parse_error`, `buttons_rejected`, `not_forwardable`, `message_not_found`, `internal_error`) ; l'unité de quota est libérée ;
- `unknown` : la réponse de Telegram s'est perdue ; le message a pu partir. Pas de réessai automatique : au membre de
  décider de renvoyer (ce qui consomme une nouvelle unité).

La réponse HTTP d'un envoi est 201 même pour `failed`/`unknown` : le résultat est dans `message.status`.

**Mise en forme — `parse_mode`** : `"HTML"` ou `"MarkdownV2"` (le mode `Markdown` historique est refusé), à l'envoi d'un texte
(`POST /conversations/:id/messages`) et d'un média avec légende (`POST /conversations/:id/media`, JSON ou multipart ; photo, document,
vidéo, animation, audio, voix). Sans `parse_mode`, le texte part brut. Le texte stocké et renvoyé est **celui qui a été envoyé, balises
comprises** : le frontend lit `parse_mode` pour décider comment l'afficher (et doit l'assainir : ne jamais injecter ce HTML tel quel).
Les aperçus de conversation et la recherche portent aussi ce texte brut avec balises. Si Telegram refuse les balises (mal fermées,
caractère non échappé en MarkdownV2…), l'envoi passe en `failed` avec `error_code: "parse_error"` et l'unité de quota est libérée.
`parse_mode` sans légende, ou sur un sticker, une video note, une localisation, etc. : 400 (`details.fields.parse_mode`).
Les albums ne prennent pas encore de `parse_mode`.

**Boutons inline — `buttons`** : tableau de lignes de boutons `{ text, url | callback_data }`, à l'envoi d'un texte ou d'un média et à la
modification (`PATCH`). Les clics reçus arrivent comme messages entrants `kind: "callback_query"` avec `callback` et `reply_to`. **Contrat complet,
limites, codes d'erreur et liste de contrôle frontend : `BUTTONS.md`.**

**Modifier — `PATCH /messages/:id`** `{ text?, parse_mode?, buttons? }` : hors quota. `buttons` absent = clavier conservé ; `buttons: []` = clavier retiré (`BUTTONS.md` §4). Ne s'applique qu'à un message **sortant déjà envoyé** (`sent`) :
texte (1–4096) ou légende de photo, document, vidéo, animation, audio, voix (0–1024 ; chaîne vide = légende retirée). Le champ
`parse_mode` absent remet le texte en brut. Réponse 200 `{ message, edited }` avec `message.text`, `message.parse_mode` et `message.edited_at`
à jour ; `edited: false` si Telegram signale un contenu identique (rien n'est écrit).
- 400 `VALIDATION_ERROR` : entrée invalide, ou balises refusées par Telegram (`details.fields.text = "parse_error"`, message inchangé).
- 404 : message inconnu, d'un autre membre ou **entrant** (un message reçu n'est jamais modifiable).
- 409 `MESSAGE_NOT_EDITABLE` : pas `sent` (`details.status`), type sans texte ni légende (`details.kind`), ou Telegram ne l'autorise plus.
- 502 `TELEGRAM_ERROR` (avec `Retry-After` si Telegram l'exige) : rien n'a changé, on peut rejouer (l'appel est idempotent).

**Supprimer — `DELETE /messages/:id`** : hors quota ; le quota déjà consommé n'est **pas** rendu. Ne s'applique qu'à un message sortant.
- `sent` depuis moins de 48 h : supprimé chez Telegram puis dans Botgram → `{ deleted: true, telegram: true }`. « Déjà supprimé chez
  Telegram » compte comme un succès.
- `failed` (jamais parti) : retiré de Botgram sans appel Telegram → `{ deleted: true, telegram: false }`.
- 409 `MESSAGE_TOO_OLD` : envoyé il y a plus de 48 h (Telegram refuse ; le message reste dans Botgram jusqu'à ses 30 jours).
- 409 `MESSAGE_NOT_DELETABLE` : `queued`, `sending` ou `unknown` (il a peut-être été livré, ou va l'être).
- 404 (inconnu, autre membre, entrant), 409 `MESSAGE_NOT_EDITABLE` (Telegram refuse), 502 `TELEGRAM_ERROR` : le message reste visible.
**Transférer, copier, réagir, épingler** : contrat complet dans `MESSAGE-ACTIONS.md` (quota, statuts, erreurs, réactions reçues).
Les modifications et suppressions comptent dans le garde-fou d'abus (`sendfail`) quand Telegram les refuse.

**« Réessayer » — `POST /messages/:id/retry`** : la réponse porte toujours le message à jour, le frontend n'a qu'à lire
`message.status`, `message.error_code`, `message.retryable`, `message.retry_at`.
- 200 `{ message, retried: true }` : relancé (nouveau `status` : `sent`, `queued` si Telegram échoue encore, ou `failed`).
- 200 `{ message, retried: false }` : le message était déjà `sent` (double clic) ; aucun nouvel appel Telegram.
- 429 `RETRY_TOO_EARLY` : trop tôt ; `error.details.retry_at` et en-tête `Retry-After`.
- 409 `MESSAGE_NOT_RETRYABLE` : `error.details.status` dit pourquoi (`failed`, `unknown`, `sending`). Un message `unknown` n'est
  jamais relancé (il a peut-être déjà été livré) ; un média ou un album en échec n'est jamais remis en file : le membre le renvoie.
- 404 : message inconnu ou d'un autre membre. 409 `BOT_DISCONNECTED`. Un réessai ne consomme pas de nouvelle unité de quota.
Un message resté `sending` plus de 2 minutes (Worker interrompu) est déclaré `unknown` à la lecture de la conversation.

### Webhook (appelé par Telegram)
- `POST /webhooks/telegram/:public_id` — en-tête `X-Telegram-Bot-Api-Secret-Token`. 200 sans corps après l'écriture ou un
  doublon connu ; 401 si le secret est invalide ou le bot inconnu ; pas de limite de débit.

### Application mobile (v15.2) — détail dans `APP-VERSIONS.md`
- En-têtes envoyés par l'application : `X-App-Platform`, `X-App-Channel`, `X-App-Build`, `X-App-Version` (facultatif). Réponse : `X-App-Update` (`none|optional|required`), `X-App-Latest-Build`, `X-App-Min-Build`.
- `GET /app/updates?platform=&channel=&build=` — public (30/min/IP) : `{ update, min_supported_code, latest }`.
- `POST /ci/releases` — `Authorization: Bearer <RELEASE_PUBLISH_TOKEN>` (compilation) : enregistre une version ; 404 si le secret n'est pas posé.
- 426 `UPGRADE_REQUIRED` sur les routes de membre quand le build est sous le minimum du canal (`details.latest` : adresse, empreinte, taille).

### Administration 👑
- `GET /admin/app-releases`, `POST /admin/app-releases`, `POST /admin/app-releases/:id/withdraw`, `GET /admin/app-stats`
- `GET /admin/members`
- `POST /admin/members/:id/disable`, `POST /admin/members/:id/enable`
- `GET /admin/audit` — filtres `action`, `target_id`

## Codes d'erreur

| Code | HTTP | Sens |
|---|---|---|
| `VALIDATION_ERROR`, `INVALID_JSON`, `TOKEN_INVALID`, `CODE_INVALID` | 400 | entrée invalide ; jeton Telegram invalide ; code de connexion faux, expiré, utilisé ou brûlé (`details.reason`) |
| `UNAUTHORIZED` | 401 | non authentifié (`details.reason`) |
| `FORBIDDEN`, `ACCOUNT_DISABLED`, `EMAIL_NOT_VERIFIED` | 403 | interdit ; compte désactivé ; e-mail à vérifier |
| `NOT_FOUND`, `METHOD_NOT_ALLOWED` | 404, 405 | |
| `UPGRADE_REQUIRED` | 426 | application trop ancienne pour son canal : écran de mise à jour obligatoire (`details.latest`) |
| `BOT_ALREADY_LINKED`, `BOT_LIMIT_REACHED`, `WEBHOOK_REPLACE_REQUIRED`, `BOT_DISCONNECTED`, `BOT_NOT_DISCONNECTED`, `BOT_CLEANUP_PENDING`, `BOT_NOT_RETRYABLE`, `MESSAGE_NOT_RETRYABLE`, `MESSAGE_NOT_EDITABLE`, `MESSAGE_NOT_DELETABLE`, `MESSAGE_TOO_OLD`, `MESSAGE_NOT_FORWARDABLE`, `MESSAGE_NOT_REACTABLE`, `MESSAGE_NOT_PINNABLE`, `CONFLICT` | 409 | conflits métier |
| `PAYLOAD_TOO_LARGE` | 413 | |
| `RATE_LIMITED`, `QUOTA_EXCEEDED`, `RETRY_TOO_EARLY` | 429 | avec en-tête `Retry-After` (secondes) |
| `TELEGRAM_ERROR` | 502 | Telegram indisponible ou refus (`details.code`) |
| `INTERNAL` | 500 | erreur interne (aucun détail) |
| `EMAIL_QUOTA_EXCEEDED`, `SERVICE_UNAVAILABLE` | 503 | plafond d'e-mails du jour atteint (avec `Retry-After`) ; service indisponible (base des messages Turso injoignable : `Retry-After: 30`, réessayer) |
