# Botgram — contrat « actions sur un message » (V1)

Contrat entre le Worker et le frontend pour quatre actions sur un message **déjà chez Telegram** : **transférer**, **copier**, **réagir** (réaction
du bot) et **épingler** dans Telegram. Il couvre aussi les **réactions des utilisateurs** reçues par webhook, et la **resynchronisation du webhook**
des bots déjà connectés. Tout est **additif** : un client qui ignore ces champs et routes continue de fonctionner.

Schéma : les colonnes `forwarded_from_message_id`, `bot_reaction`, `reactions` et `pinned_at` de `messages` font partie de `migrations/` (schéma). Une base créée avec les anciennes migrations les a déjà.

| Action | Route | Quota | Crée un message ? |
|---|---|---|---|
| Transférer | `POST /messages/:id/forward` | **1 unité** | oui (sortant, dans la conversation cible) |
| Copier | `POST /messages/:id/copy` | **1 unité** | oui (sortant, dans la conversation cible) |
| Réagir | `PUT /messages/:id/reaction` · `DELETE /messages/:id/reaction` | aucun | non |
| Épingler dans Telegram | `POST /messages/:id/pin` · `DELETE /messages/:id/pin` | aucun | non |
| Bot déjà connecté : recevoir les réactions | `POST /bots/:id/resync-webhook` | aucun | non |

Ne pas confondre avec `POST /conversations/:id/pin` (épinglage **local** d'une conversation, en tête de liste, qui ne touche pas Telegram).

## 1. Règles communes

- ✉️ Toutes les routes exigent une session **et un e-mail vérifié**, comme les envois.
- Le message doit **exister chez Telegram** : entrant (`status: "received"`) ou sortant **`sent`** (avec un `telegram_message_id`), et ne pas avoir expiré
  (30 jours). Sinon : **404** (inconnu, d'un autre membre, expiré) ou **409** avec un code propre à l'action (voir §6) et `details.reason` :
  `not_on_telegram` (jamais parti, ou pas encore : `queued`, `sending`, `failed`, `unknown`) ou `kind` (type non concerné, avec `details.kind`).
- Types concernés : texte, photo, document, vidéo, animation, audio, voix, video note, sticker (+ localisation, lieu, contact, dé, qui ne sont pas envoyables aujourd'hui
  par la route `/media`, mais le sont s'ils viennent d'un utilisateur). **Exclus** : un clic de bouton (`callback_query`), un album sortant, tout contenu `other`.
- **409 `BOT_DISCONNECTED`** si le bot est déconnecté.
- Les refus de Telegram comptent dans le garde-fou d'abus (`sendfail`, 30 par heure et par membre), comme pour un envoi.

## 2. Transférer et copier

`POST /messages/:id/forward` — Telegram affiche **« Transféré de… »**.
`POST /messages/:id/copy` — même contenu, **sans** en-tête.

Corps (JSON) :

```json
{ "target_conversation_id": "<id de la conversation cible>", "client_message_id": "fwd-1", "buttons": [[{ "text": "Oui", "callback_data": "x" }]] }
```

| Champ | | |
|---|---|---|
| `target_conversation_id` | requis | conversation de destination. Peut être la conversation d'origine. |
| `client_message_id` | facultatif | idempotence, comme pour un envoi : un rejeu renvoie le même message en **200**, sans second appel ni seconde unité. |
| `buttons` | **copie seulement** | clavier inline du nouveau message (même forme et mêmes limites que `BUTTONS.md`). Refusé sur un transfert (`unknown_field`). |

**La cible doit être une conversation du même bot que la source** : un `file_id` n'est valable que pour le bot qui l'a reçu, et Telegram refuse l'accès croisé.
Sinon **400** `VALIDATION_ERROR`, `fields.target_conversation_id = "other_bot"`. Cible inconnue ou d'un autre membre : **404**.

Réponse **201** `{ "message": { … } }` : le **nouveau** message sortant, dans la conversation cible.

```json
{ "id": "…", "conversation_id": "<cible>", "direction": "out", "kind": "text", "text": "bonjour", "status": "sent",
  "forwarded_from": "<id du message source>", "telegram_message_id": 1000, "buttons": null, … }
```

- `forwarded_from` : id Botgram du message source pour un **transfert** ; `null` pour une copie (et pour tout message ordinaire). Le source peut avoir expiré depuis : ne pas supposer qu'il existe.
- Le contenu est repris du source : `kind`, `text` (texte ou légende), pièce jointe (`attachment`, téléchargeable via `GET /messages/:id/attachment` comme tout média).
  Un message **sortant** garde son balisage et son `parse_mode` ; un message **reçu** est enregistré en texte brut (Telegram, lui, transmet bien la mise en forme d'origine).
- Botgram **ne suit pas le clavier du message source** : `message.buttons` vaut `null`, sauf pour une copie où l'on passe `buttons`. Ce que Telegram fait exactement des claviers existants lors d'un transfert ou d'une copie reste à constater au premier essai réel : ne pas s'appuyer dessus.
- **Quota** : une unité, **réservée avant l'appel** et gérée comme un envoi (confirmée si `sent` ou `unknown`, libérée si `failed`). Plafond atteint : **429** `QUOTA_EXCEEDED`.
- **Statuts** : `sent`, `failed` ou `unknown` (réponse perdue : peut-être livré, jamais rejoué automatiquement). **Jamais `queued`** : un échec temporaire de Telegram (429, 5xx)
  donne `failed`, `retryable: false`, et **« Réessayer » est refusé** (409 `MESSAGE_NOT_RETRYABLE`) — le membre relance l'action. La réponse HTTP reste **201** même pour `failed` / `unknown`.
- `error_code` possibles d'un échec : `not_forwardable` (message protégé ou transfert interdit par Telegram), `message_not_found` (source supprimée chez Telegram), `blocked`, `chat_not_found`,
  `forbidden`, `token_invalid`, `rate_limited`, `telegram_unavailable`, `bad_request`, `bot_disconnected`, `internal_error`.

## 3. Réaction du bot

`PUT /messages/:id/reaction` `{ "emoji": "👍" }` → **200** `{ "message": { …, "reaction": "👍" } }` — pose la réaction.
`DELETE /messages/:id/reaction` → **200** `{ "message": { …, "reaction": null } }` — la retire.

- **Une seule réaction par message** : une nouvelle remplace l'ancienne. Rejouer le même appel donne le même état (idempotent).
- Concerne les messages **entrants et sortants**. Hors quota.
- `emoji` : un seul emoji, 16 unités au plus, sans espace ni lettre. Forme invalide : **400** `fields.emoji = "required" | "bad_format"`. **La liste exacte des réactions permises est celle de
  Telegram** (un sous-ensemble d'emojis) : hors liste, Telegram refuse et le Worker répond **400** `fields.emoji = "not_allowed"`. Les réactions personnalisées et payantes ne sont pas prises en charge.
- `message.reaction` : la réaction **du bot** sur ce message (`null` si aucune). Telegram ne renvoie jamais au bot sa propre réaction : cette valeur est ce que Botgram a posé.
- Telegram momentanément indisponible : **502** `TELEGRAM_ERROR` (avec `Retry-After` s'il l'exige), rien n'est changé : on peut rejouer.

## 4. Réactions des utilisateurs (reçues)

Quand un utilisateur réagit à un message, Telegram envoie un `message_reaction` au webhook (événement ajouté à `allowed_updates`). Le Worker met à jour le message **sans créer d'autre message**.

`message.reactions` : liste `[{ "emoji": "👍", "count": 2 }, …]`, la plus nombreuse d'abord (à égalité : ordre des emojis), `[]` s'il n'y en a pas. Présent sur tous les messages.

- **Compté par emoji, pas par personne** : le Worker garde en interne qui a réagi (par utilisateur Telegram) pour pouvoir remplacer ou retirer, mais n'expose que les totaux.
- Un utilisateur qui change de réaction **remplace** les siennes ; qui les retire fait baisser les compteurs.
- Retenues : les réactions **emoji d'un utilisateur identifié**. Ignorées : réactions personnalisées, payantes, réactions **anonymes** (admin anonyme, canal) et le décompte global des canaux (`message_reaction_count` n'est pas demandé).
- Un événement **plus ancien** que celui déjà enregistré pour le même utilisateur est ignoré (Telegram peut rejouer dans le désordre).
- Message expiré, inconnu ou conversation inconnue : ignoré (le webhook répond 200).
- Dans un groupe, Telegram ne livre ces événements que si le bot est **administrateur**.

### Bots déjà connectés : `POST /bots/:id/resync-webhook`

La liste d'événements demandée à Telegram est posée **à la connexion du bot**. Un bot connecté **avant** ce déploiement ne reçoit donc pas encore `message_reaction`.

`POST /bots/:id/resync-webhook` (✉️, sans corps) repose le webhook avec la liste à jour et **un nouveau secret** → **200** `{ bot }` (statut `connected`).

- Réservé aux bots `connected` : sinon **409** `BOT_NOT_RETRYABLE` (pour un bot en erreur, `retry-webhook` fait la même chose).
- Sans perte : pendant l'échange, Telegram réessaie ce qui arrive avec l'ancien secret.
- Échec de Telegram : **502** `TELEGRAM_ERROR`, la fiche passe en `webhook_error` (ou `token_invalid`) et `POST /bots/:id/retry-webhook` la répare.
- Idempotent : on peut le rappeler sans effet de bord autre que le renouvellement du secret.

**À faire une fois par bot connecté après le déploiement** (par exemple à l'ouverture du bot dans l'interface, ou par un script d'exploitation). Les bots connectés ensuite sont déjà à jour.

## 5. Épingler dans Telegram

`POST /messages/:id/pin` — corps facultatif `{ "notify": true }` → **200** `{ "message": { …, "pinned_at": 1760000000000 } }`.
`DELETE /messages/:id/pin` → **200** `{ "message": { …, "pinned_at": null } }`.

- `notify` (défaut `false`) : sans lui, l'épinglage est **silencieux** (pas de notification chez les participants). Corps invalide ou champ inconnu : **400**.
- `message.pinned_at` : date (ms) à laquelle **Botgram** a épinglé le message, `null` sinon. Ce que l'on fait depuis Telegram (épingler, désépingler, « tout désépingler ») **n'est pas suivi**.
- Désépingler un message qui n'est plus épinglé chez Telegram vaut succès (l'état voulu est atteint) : `pinned_at` repasse à `null`.
- Concerne les messages entrants et sortants. Hors quota. Dans un **groupe ou un canal**, le bot doit avoir le droit d'épingler : sinon **502** `TELEGRAM_ERROR`, `details.code = "not_enough_rights"`, état inchangé.

## 6. Codes d'erreur

| Situation | HTTP / valeur |
|---|---|
| Message inconnu, d'un autre membre, expiré ; conversation cible inconnue ou d'un autre membre | 404 `NOT_FOUND` |
| Transfert / copie impossible (pas chez Telegram, type exclu) | 409 `MESSAGE_NOT_FORWARDABLE` (`details.reason`) |
| Réaction impossible | 409 `MESSAGE_NOT_REACTABLE` |
| Épinglage impossible | 409 `MESSAGE_NOT_PINNABLE` |
| Cible d'un autre bot ; cible manquante ; `emoji` invalide ou refusé par Telegram ; corps invalide | 400 `VALIDATION_ERROR` (`details.fields.<champ>`) |
| Bot déconnecté | 409 `BOT_DISCONNECTED` |
| Plafond quotidien (transfert, copie) | 429 `QUOTA_EXCEEDED` (+ `Retry-After`) |
| Refus de Telegram à la réaction / l'épinglage (droits, message supprimé…) | 502 `TELEGRAM_ERROR`, `details.code` : `not_enough_rights`, `message_not_found`, `rate_limited`, `telegram_unavailable`, … |
| Refus de Telegram au transfert / à la copie | message `status: "failed"`, `error_code` (§2), HTTP 201 |
| Jeton du bot invalide | 400 `TOKEN_INVALID` (réaction, épinglage) ; `error_code: "token_invalid"` (transfert, copie) ; le bot passe en `token_invalid` |
| `resync-webhook` sur un bot pas `connected` | 409 `BOT_NOT_RETRYABLE` |

## 7. Liste de contrôle pour le frontend

1. Tolérer les nouveaux champs de `message` : `forwarded_from` (`string | null`), `reaction` (`string | null`), `reactions` (`[{emoji, count}]`, jamais `null`), `pinned_at` (`number | null`). Anciens messages : valeurs neutres.
2. Transfert / copie : proposer **uniquement les conversations du même bot** ; afficher « Transféré » quand `forwarded_from` est renseigné ; prévoir `failed` / `unknown` sans « Réessayer » ; envoyer un `client_message_id` pour éviter les doublons sur double clic.
3. Réaction : afficher `reaction` (celle du bot) et `reactions` (celles des utilisateurs) distinctement ; proposer les emojis courants (👍 ❤️ 🔥 🎉…) et gérer le 400 `not_allowed` comme « cette réaction n'est pas permise par Telegram ».
4. Épinglage : afficher un repère quand `pinned_at` est non nul ; ne pas supposer que l'état reflète ce qui a été fait dans l'application Telegram.
5. **Après déploiement** : appeler une fois `POST /bots/:id/resync-webhook` pour chaque bot connecté avant de compter sur les réactions reçues.
6. Ne jamais interpréter `emoji`, `reaction` ou `reactions[].emoji` comme du HTML.
