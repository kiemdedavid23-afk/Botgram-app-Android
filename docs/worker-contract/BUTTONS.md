# Botgram — contrat « boutons inline » (V1)

Ce document est le contrat entre le Worker et le frontend pour les **claviers de boutons inline** : envoyer des boutons avec un
message, les modifier, et recevoir les clics. Il complète `API.md` (qui en reprend le résumé). Rien ici ne change le comportement
des routes existantes : tout est **additif** (un client qui ignore `buttons` et `callback` continue de fonctionner).

Schéma : la colonne `messages.buttons` fait partie de `migrations/` (schéma). Une base créée avec les anciennes migrations l'a déjà.

## 1. Périmètre

| | |
|---|---|
| Pris en charge | Clavier **inline** attaché à un message sortant : boutons **lien** (`url`) et boutons **action** (`callback_data`). |
| Messages concernés | Texte, photo, document, vidéo, animation, audio, voix, video note, sticker. (Localisation, lieu, contact et dé acceptent un clavier côté domaine, mais **la route `/media` actuelle ne transmet pas leurs champs** : ils ne sont pas envoyables aujourd'hui, avec ou sans boutons.) |
| Pas pris en charge | **Albums** (Telegram n'accepte pas de clavier sur un groupe de médias). Claviers de réponse (`ReplyKeyboardMarkup`, « force reply »). Boutons `web_app`, `login_url`, `switch_inline_query*`, `copy_text`, `pay`, `callback_game` : refusés comme champ inconnu. Mode inline (`inline_query`). |
| Hors quota | Les boutons ne coûtent rien : un envoi avec boutons consomme **une** unité de quota comme un envoi sans ; modifier ou retirer un clavier n'en consomme aucune. |

## 2. Le modèle : `buttons`

Un clavier est un **tableau de lignes** ; une ligne est un **tableau de boutons** ; un bouton est un objet à **deux clés** :

```json
"buttons": [
  [ { "text": "Oui", "callback_data": "choix:oui" }, { "text": "Non", "callback_data": "choix:non" } ],
  [ { "text": "Voir le programme", "url": "https://example.com/programme" } ]
]
```

- `text` : l'intitulé affiché, 1 à 64 caractères (hors espaces seuls).
- **exactement un** de `url` ou `callback_data` par bouton.
- `url` : 1 à 2048 caractères, URL valide en `https:`, `http:` ou `tg:`. Tout autre schéma (`javascript:`, `ftp:`…) est refusé.
- `callback_data` : 1 à **64 octets** (UTF-8 : un « é » compte 2). C'est la valeur renvoyée dans `callback.data` quand on clique.
- Plafonds : **8 boutons par ligne**, **100 boutons** au total, 100 lignes, 32 Ko de JSON.
- Aucune autre clé n'est acceptée (`unknown_field`).

Dans une réponse, `message.buttons` vaut le clavier tel qu'envoyé, ou `null` s'il n'y en a pas (message entrant, ou sans clavier).

### Erreurs de validation

Toute erreur est un **400 `VALIDATION_ERROR`** dont `error.details.fields` donne le **chemin exact** de chaque défaut
(`buttons[ligne][colonne].champ`). Aucune requête Telegram n'est faite, aucun quota consommé. Exemple :

```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "Entrée invalide.",
  "details": { "fields": { "buttons[0][1].callback_data": "too_long", "buttons[1][0].url": "bad_scheme" } } } }
```

| Valeur | Sens | Clé concernée |
|---|---|---|
| `must_be_array` | pas un tableau (ou ligne qui n'est pas un tableau) | `buttons`, `buttons[i]` |
| `empty_row` | ligne vide | `buttons[i]` |
| `too_many_rows`, `too_many_buttons` | plafond dépassé (100 lignes ; 8 par ligne ; 100 au total) | `buttons`, `buttons[i]` |
| `too_long` | clavier trop volumineux (32 Ko) ; ou texte, URL, `callback_data` trop long | `buttons`, `….text`, `….url`, `….callback_data` |
| `must_be_object` | un bouton n'est pas un objet | `buttons[i][j]` |
| `required` / `too_short` | `text` manquant ou vide ; `callback_data` ou URL vide | `….text`, `….callback_data`, `….url` |
| `url_or_callback_data_required` | ni `url` ni `callback_data` | `buttons[i][j]` |
| `url_and_callback_data` | les deux à la fois | `buttons[i][j]` |
| `bad_format` / `bad_scheme` | URL illisible ; schéma autre que `https`, `http`, `tg` | `….url` |
| `must_be_string` | `url` ou `callback_data` pas une chaîne | `….url`, `….callback_data` |
| `unknown_field` | clé inconnue dans un bouton (`web_app`…) | `buttons[i][j].<clé>` |
| `invalid_json` | multipart : le champ `buttons` n'est pas du JSON | `buttons` |

Telegram a le dernier mot : il peut encore refuser un bouton que le Worker accepte (par exemple une URL qu'il juge invalide,
comme `http://localhost/…`). Voir §3 et §4 pour ce que le frontend reçoit alors.

## 3. Envoyer un message avec boutons

### Texte — `POST /conversations/:id/messages`

```json
{ "text": "<b>Venez-vous ?</b>", "parse_mode": "HTML", "buttons": [[{ "text": "Oui", "callback_data": "choix:oui" }]] }
```

Réponse **201** `{ "message": { …, "buttons": [[…]], "status": "sent" } }` (200 si `client_message_id` déjà vu). `buttons` absent ou `[]` :
message sans clavier.

### Média — `POST /conversations/:id/media`

- **JSON** : champ `buttons`, même forme (avec `kind`, `file_id` ou `url`, `caption`, `parse_mode`).
- **multipart/form-data** : le champ `buttons` est un **texte JSON** (`buttons=[[{"text":"Oui","callback_data":"x"}]]`). JSON illisible : 400, `fields.buttons = "invalid_json"`.

### Statuts

Le clavier suit le message dans tout son cycle d'envoi : `sent`, `queued` (le « Réessayer » renvoie **le même clavier**, aucune action du
frontend), `failed`, `unknown`.

Si Telegram refuse les boutons à l'envoi, le message passe en **`failed`** avec **`error_code: "buttons_rejected"`** et l'unité de quota est
libérée. Le frontend doit proposer de corriger et renvoyer (ce n'est pas un échec temporaire : « Réessayer » n'est jamais proposé).

## 4. Modifier ou retirer le clavier — `PATCH /messages/:id`

Corps : `{ text?, parse_mode?, buttons? }` — **au moins `text` ou `buttons`**. Seul un message **sortant déjà `sent`** est modifiable.

| `text` | `buttons` | Effet | Appel Telegram |
|---|---|---|---|
| fourni | absent | texte (ou légende) modifié, **clavier conservé** | `editMessageText` / `editMessageCaption` + clavier actuel |
| fourni | `[[…]]` | texte modifié **et** clavier remplacé | idem + nouveau clavier |
| fourni | `[]` | texte modifié **et** clavier retiré | idem sans clavier |
| absent | `[[…]]` | clavier remplacé, contenu inchangé | `editMessageReplyMarkup` |
| absent | `[]` | clavier retiré, contenu inchangé | `editMessageReplyMarkup` sans clavier |
| absent | absent | **400** (`fields.text = "required"`) | — |

Points à retenir :

- **`buttons` absent ≠ `buttons: []`.** Absent = « ne touche pas au clavier ». Pour le retirer, envoyer `[]`. (Chez Telegram, modifier un texte sans
  repasser le clavier le retire : le Worker s'en charge, le frontend n'a rien à renvoyer pour le conserver.)
- Modifier **seulement le clavier** ne renseigne pas `edited_at` (Telegram n'affiche pas « modifié » non plus). Modifier le texte ou la légende, si.
- `parse_mode` sans `text` : 400 (`fields.parse_mode = "text_required"`).
- Un **sticker** ou une video note n'ont ni texte ni légende : `text` donne 409 `MESSAGE_NOT_EDITABLE`, mais leur **clavier** est modifiable.
- Un **album** n'est jamais modifiable (409 `MESSAGE_NOT_EDITABLE`, `details.kind = "other"`).
- Réponse 200 `{ message, edited }` ; `edited: false` quand Telegram signale que rien ne change (même clavier, même texte).
- Boutons refusés par Telegram : **400** `VALIDATION_ERROR`, `fields.buttons = "rejected"`, le message et son clavier restent inchangés.
- Les autres erreurs sont celles du §« Modifier » de `API.md` (404, 409, 502).

La **suppression** d'un message (`DELETE /messages/:id`) supprime son clavier avec lui ; les clics déjà reçus restent lisibles (§5).

## 5. Recevoir les clics

Quand un utilisateur appuie sur un bouton **action**, Telegram envoie un `callback_query` au webhook. Le Worker :

1. enregistre un message **entrant** de `kind: "callback_query"` dans la conversation (soumis aux 30 jours de rétention, comme tout message) ;
2. le **rattache au message qui portait le bouton** (même mécanisme que `reply_to`) ;
3. **acquitte** le clic auprès de Telegram (sans texte), en tâche de fond, pour arrêter l'animation d'attente chez l'utilisateur.

Un bouton **lien** (`url`) n'envoie rien au Worker : Telegram ouvre simplement le lien.

Forme dans `GET /conversations/:id/messages` :

```json
{
  "id": "…", "direction": "in", "kind": "callback_query", "status": "received",
  "text": "choix:oui",
  "callback": { "data": "choix:oui", "label": "Oui" },
  "reply_to": { "id": "<id du message qui portait le bouton>", "kind": "text", "excerpt": "Venez-vous ?" },
  "buttons": null, "telegram_message_id": null, "created_at": 1760000000000, "expires_at": 1762592000000
}
```

- `callback.data` : la valeur `callback_data` du bouton, **texte brut non fiable** (ne jamais l'insérer comme HTML). `text` porte la même valeur (conservé pour les clients existants).
- `callback.label` : l'intitulé du bouton (`"Oui"`), retrouvé dans le clavier du message d'origine. **`null`** si le message d'origine n'existe plus (supprimé, expiré à 30 jours, hors conversation), ou si le clavier a été modifié depuis et ne contient plus cette valeur. Le frontend affiche alors `callback.data`.
- `reply_to` : le message d'origine. S'il est introuvable chez Botgram : `{ "telegram_message_id": 123, "missing": true }`. Absent si Telegram n'a pas fourni de message (cas des clics venus du mode inline).
- `callback` n'existe que sur les `callback_query` (le champ est absent des autres messages).
- Un même `update_id` rejoué par Telegram ne crée **qu'un seul** enregistrement.

Limites à connaître :

- **Dans un groupe**, le Worker ne conserve pas *qui* a cliqué : le clic apparaît dans la conversation du groupe sans auteur. (En discussion privée, l'auteur est l'interlocuteur.)
- Le clic n'a **pas d'identifiant Telegram de message** : on ne peut pas y répondre avec `reply_to` (404 `REPLY_TARGET_UNAVAILABLE`). Pour répondre, envoyer un message normal, ou répondre au message d'origine (`reply_to.id`).
- L'acquittement est **automatique et sans texte** : l'utilisateur ne voit pas de message de confirmation. Une réponse personnalisée (texte ou alerte) n'est pas incluse dans cette version.
- Telegram n'accepte d'acquitter un clic que pendant un délai court : le Worker acquitte immédiatement, sans attendre le membre. Si l'acquittement échoue, le clic est quand même enregistré.

## 6. Récapitulatif des codes

| Situation | Statut HTTP / valeur | Où |
|---|---|---|
| Forme invalide (§2) | 400 `VALIDATION_ERROR`, `details.fields.<chemin>` | envoi, modification |
| Boutons refusés par Telegram à l'envoi | message `status: "failed"`, `error_code: "buttons_rejected"` | envoi |
| Boutons refusés par Telegram à la modification | 400 `VALIDATION_ERROR`, `fields.buttons = "rejected"` | modification |
| Ni `text` ni `buttons` | 400, `fields.text = "required"` | modification |
| `parse_mode` sans `text` | 400, `fields.parse_mode = "text_required"` | modification |
| Type de message sans texte ni légende (avec `text`), ou album | 409 `MESSAGE_NOT_EDITABLE` | modification |
| Message pas `sent`, ou Telegram ne l'autorise plus | 409 `MESSAGE_NOT_EDITABLE` | modification |
| Telegram momentanément indisponible | 502 `TELEGRAM_ERROR` (+ `Retry-After`), rien n'a changé | modification |

## 7. Liste de contrôle pour le frontend

1. Lire `message.buttons` (liste de lignes, ou `null`) et afficher : un bouton `url` = lien (`rel="noopener noreferrer"`, nouvel onglet) ; un bouton `callback_data` = **non cliquable** côté membre (c'est l'utilisateur Telegram qui clique, pas le membre).
2. Afficher les `callback_query` comme un événement de la conversation : « *Alice a choisi « Oui »* » avec `callback.label ?? callback.data`, éventuellement lié au message d'origine par `reply_to.id`.
3. Éditeur de clavier : respecter les plafonds du §2 côté interface, et afficher les erreurs de `details.fields` en face du bon bouton grâce au chemin `buttons[i][j].champ`.
4. Modification : pour garder le clavier, **ne pas envoyer** `buttons` ; pour le retirer, envoyer `buttons: []`.
5. `error_code: "buttons_rejected"` : message d'erreur dédié, bouton « Corriger et renvoyer », jamais « Réessayer ».
6. Ne jamais interpréter `callback.data`, `callback.label` ni `text` comme du HTML.
7. Tolérer `buttons` et `callback` absents ou `null` partout (anciens messages, messages entrants).
