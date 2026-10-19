# Passerelle GAS (e-mails et photos) — contrat et mise en place

Le Worker n'envoie pas d'e-mails et ne stocke pas de fichiers : il appelle une application Web Google Apps Script
(`gas/Code.gs`). Deux métiers : l'**e-mail du code de connexion** et les **photos de profil des contacts** (Drive).

## Contrat (version 1)

**Requête** : `POST <GAS_URL>`, JSON.

```json
{
  "v": 1,
  "ts": 1760000000000,
  "request_id": "uuid de la demande",
  "type": "login_code",
  "to": "membre@exemple.com",
  "lang": "fr",
  "code": "042917",
  "sig": "hex"
}
```

- `type` : `login_code` (le seul e-mail). `lang` : `fr` ou `en`. `code` : exactement 6 chiffres. Le sujet de l'e-mail est « Votre code Botgram : 042917 ».
- `sig` = HMAC-SHA-256 (hex) avec `GAS_SECRET` du texte `ts \n request_id \n type \n to \n lang \n code`.
  La signature est dans le corps parce qu'une application Web Apps Script **ne peut pas lire les en-têtes**.
- Le Worker n'envoie à GAS **aucun mot de passe ni hash (le code part uniquement vers l'adresse concernée), ni jeton Telegram, ni secret de webhook, ni cookie**.

**Réponse** : JSON `{ "ok": true }` (e-mail parti, ou `request_id` déjà traité) ou `{ "ok": false, "error": "<code>" }`.
Le Worker marque l'e-mail `sent` **uniquement** sur `{ "ok": true }`. Toute autre réponse, un corps illisible ou une panne
réseau donne `failed` (visible dans `login_codes.send_error`, ex. `gas_quota`), jamais `sent`.

Codes d'erreur : `not_configured`, `bad_request`, `bad_signature`, `stale` (écart d'horloge > 5 min), `bad_type`,
`bad_address`, `bad_code`, `busy`, `quota`, `internal`, `method_not_allowed`.

## Photos de contacts (`type: "store_profile_photo"`)

Contrat complet dans `docs/CONTACTS-DRIVE.md`. Le script vérifie la signature (`ts \n request_id \n type \n contact_id \n bot_id \n mime`)
et la fraîcheur, accepte seulement `image/jpeg`, `image/png`, `image/webp` jusqu'à 2 Mo, range le fichier dans Drive sous le nom
`<contact_id>` et répond `{ ok: true, drive_file_id, url }`. Même contact ou même `request_id` : le fichier existant est renvoyé.
Codes d'erreur supplémentaires : `bad_mime`, `too_large`, `bad_bytes`, `share_failed`.
Suppression (`type: "delete_profile_photo"`, signature `ts \n request_id \n type \n contact_id`) : met à la corbeille Drive les fichiers
nommés `<contact_id>` du dossier des photos, sans jamais créer de dossier ; photo absente = `{ ok: true, deleted: 0 }`. Appelée par la
purge (contacts inactifs 30 jours) et à la suppression de la fiche d'un bot. **À redéployer en nouvelle version après mise à jour.**
Le Worker n'attend pas cet appel pour répondre à Telegram : il est exécuté en tâche de fond (`waitUntil`).

Propriétés du script facultatives :
- `DRIVE_FOLDER_ID` : dossier Drive des photos ; sinon « Botgram - photos de contacts » est créé à la première photo ;
- Partage des photos : **toujours actif**. Chaque photo de contact est rendue lisible par toute personne qui possède son lien (le dossier
  reste privé ; l'identifiant du fichier n'est pas devinable), et l'adresse renvoyée est une miniature affichable dans une balise image.
  Si le partage échoue (règle d'un compte Google Workspace qui interdit le partage public), le fichier est mis à la corbeille et la
  réponse est `share_failed` : le contact garde ses initiales. Un fichier déjà présent mais jamais partagé (créé par une ancienne version)
  l'est au passage suivant. **Confidentialité :** toute personne qui obtient l'adresse d'une photo peut la voir.

**Protections** : requête signée et récente ; un modèle fixe (pas de texte libre) ; code obligatoirement à 6 chiffres ; un même `request_id` n'envoie qu'un seul e-mail (6 h) ; la validité de 6 minutes annoncée dans le message est celle du Worker ; un seul e-mail à la fois (verrou tenu une seconde, **jamais** par les photos, pour qu'un envoi vers Drive ne fasse pas répondre « busy » aux codes de connexion) ; quota restant vérifié.

## Mise en place (depuis un téléphone)

1. Ouvrir <https://script.google.com> avec le compte Google qui enverra les e-mails → **Nouveau projet**.
2. Remplacer le contenu de `Code.gs` par celui du fichier `gas/Code.gs`.
3. **Paramètres du projet** (roue dentée) → **Propriétés du script** → ajouter :
   - `GAS_SECRET` : un texte aléatoire de 32 caractères ou plus (le même sera posé côté Worker) ;
   - `SENDER_NAME` (facultatif) ;
   - `DRIVE_FOLDER_ID` (facultatif, voir « Photos de contacts »).
4. **Déployer** → **Nouveau déploiement** → type **Application Web** → *Exécuter en tant que* : **Moi** ;
   *Qui a accès* : **Tout le monde** → autoriser l'envoi d'e-mails **et l'accès à Drive** (nécessaire aux photos) → copier l'**URL de l'application Web** (`…/exec`).
5. Côté Worker, poser les secrets `GAS_URL` (cette URL) et `GAS_SECRET` (même valeur qu'à l'étape 3).
6. Test : dans l'éditeur, remplacer l'adresse dans `testEnvoi_()` par la vôtre et l'exécuter ; le journal doit afficher `{"ok":true}`.

Le script n'a pas été exécuté sur le runtime de Google : `test/gas.test.js` l'exécute dans une simulation d'Apps Script.
Premier essai réel conseillé : un e-mail (`testEnvoi_()`), puis une photo (écrire à un bot depuis un nouveau compte Telegram).

Après toute modification du script : **Déployer → Gérer les déploiements → modifier → Nouvelle version**
(l'URL ne change pas). Sans nouvelle version, l'ancienne reste servie.

Quotas Google : environ 100 destinataires par jour pour un compte Gmail gratuit, 1 500 pour Google Workspace.
