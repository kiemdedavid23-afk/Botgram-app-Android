# Cache photo contacts — Worker, GAS, Drive

## Règle

Telegram est consulté uniquement à la **création** du contact.
Les lectures (liste, détail, historique, recherche, avatar) n’appellent ni Telegram ni GAS.

## Worker → GAS

`POST GAS_URL`, JSON signé :

```json
{
  "v": 1,
  "type": "store_profile_photo",
  "request_id": "photo:<contact_id>",
  "contact_id": "...",
  "bot_id": "...",
  "mime": "image/jpeg",
  "bytes_b64": "...",
  "sig": "HMAC de ts \\n request_id \\n type \\n contact_id \\n bot_id \\n mime"
}
```

Réponse attendue : `{ "ok": true, "drive_file_id": "...", "url": "..." }`.
Même `request_id` : GAS doit renvoyer le fichier existant, sans doublon Drive.

Aucun jeton Telegram, aucun secret, n’est envoyé à GAS.

## D1

`contacts` ajoute : `drive_file_id`, `photo_url`, `photo_status` (`none|pending|stored|absent|failed`), `photo_attempted_at`, `photo_error`.

## Affichage

Les conversations (`GET /bots/:id/conversations`, `/updates`, `/conversations/:id`) et les contacts portent `has_photo` et **`photo_url`** :
une miniature Drive (`https://drive.google.com/thumbnail?id=…&sz=w256`) que le frontend met telle quelle dans `<img src>`. Aucun jeton n'est
nécessaire (une balise image n'en envoie pas, et en mode « corps » il n'y a pas de cookie) : le fichier est partagé par lien par la passerelle.
`photo_url` vaut `null` sans photo : le client affiche les initiales. `GET /conversations/:id/avatar` redirige vers la même miniature (404 sans photo).
La collecte de la photo tourne en tâche de fond : le premier message est enregistré et le webhook répond avant la fin
de l'appel à GAS ; `photo_status` passe de `pending` à `stored` ou `failed`.

## Suppression

`delete_profile_photo` (voir `docs/GAS.md`) met la photo à la corbeille. Le contact (ligne D1) n'est supprimé qu'après ce succès :
30 jours sans activité et sans conversation, ou à la déconnexion du bot. Un échec laisse la ligne en place, réessayée au passage suivant.

## Confidentialité

Le dossier Drive ne doit pas être listable publiquement : le partage porte sur chaque fichier, jamais sur le dossier.
Conséquence : toute personne disposant de l’URL d’une photo peut la voir (l'identifiant du fichier n'est pas devinable).
