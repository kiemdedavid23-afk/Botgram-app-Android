## Actions locales

- `POST /conversations/:id/pin` body `{ pinned: true|false }` — épinglage local, en tête de liste.
- `DELETE /conversations/:id` body `{ confirm: true }` — suppression définitive locale (messages en cascade). Ne touche pas Telegram.
- `GET /bots/:id/search/conversations?q=` — titre, username, prénom, nom.
- `GET /bots/:id/search/messages?q=` — texte enregistré par Botgram uniquement.
- `POST /conversations/:id/profile-refresh` — tente `getUserProfilePhotos` (chat privé), stocke un `file_id`.
- `GET /conversations/:id/avatar` — image si `file_id` connu, sinon 404 (initiales côté client).

Création : uniquement au premier événement webhook. Pas de conversation vide manuelle.
