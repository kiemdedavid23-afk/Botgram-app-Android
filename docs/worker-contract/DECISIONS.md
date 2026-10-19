# Botgram — décisions de conception (V1)

Ce document fixe ce que le Worker fait et, surtout, **où il s'écarte des anciens documents** (01 à 16).
Là où les anciens documents se contredisaient, la règle suivie est : le document le plus récent gagne
(13, 14, 15, 16 priment sur 02, 04, 05, 11).

## 1. Cadre

| Sujet | Décision |
|---|---|
| Langage | JavaScript pur, modules ES. Pas de TypeScript, pas de Hono, aucune dépendance en production. |
| Routeur | Écrit à la main (`src/http/router.js`) : un tableau de routes, correspondance par segments. |
| Hébergement | Un Worker, Workers Free visé, deux entrées : `fetch` et `scheduled` (une seule tâche : la purge, toutes les 3 heures). |
| Stockage | D1 seulement. Pas de R2, pas de KV, pas de file d'attente. |
| Structure | route → domaine → adaptateur (D1, Telegram, GAS). Une route ne parle jamais à Telegram ni à GAS. |
| Temps | Tous les horodatages sont en millisecondes Unix. Les jours de quota sont des jours UTC. |

## 2. Règles retenues

- **Connexion sans mot de passe, comme Telegram** : l'utilisateur donne son adresse, reçoit un code à 6 chiffres par e-mail et le
  saisit ; une adresse inconnue crée le compte (le code prouve l'adresse). Code : 6 minutes, un usage, 5 essais, HMAC stocké
  (jamais le code), une ligne par adresse (une nouvelle demande remplace la précédente), 30 s entre deux envois, 3 par heure
  par adresse. Un code plutôt qu'un lien : pas d'aller-retour vers Gmail, et il marche si l'e-mail est lu sur un autre appareil.
  Réponse à la demande identique que le compte existe ou non. Pourquoi pas de mot de passe : plus de hachage lourd dans le
  Worker (10 ms de CPU sur Workers Free), plus de réinitialisation, moins de surface d'attaque. Un mot de passe 2FA facultatif
  pourra venir plus tard (`docs/PASSWORD-KDF.md`, `tools/derive-password-key.js`, conservés pour cela).
- **Quota d'e-mails** : chaque connexion sur un nouvel appareil consomme un e-mail GAS (≈100 par jour pour un Gmail gratuit).
  Le Worker plafonne le total par jour UTC (`EMAIL_DAILY_LIMIT`, 90) et répond 503 au-delà plutôt que de laisser GAS refuser.
  Limite assumée : quelqu'un qui demande des codes pour de fausses adresses depuis plusieurs IP peut épuiser ce plafond et bloquer
  les connexions du jour (10 demandes par IP et par 15 min ; pas de CAPTCHA). Si cela arrive : fournisseur d'e-mail à API, voir §4.
- **Session** (révisée en v15.2) : échéance absolue à 180 jours, jamais repoussée. Jeton d'accès 2 heures (les jetons sont vérifiés en base à chaque
  requête : une durée courte n'apporte presque pas de sécurité, elle coûte un renouvellement). Jeton de renouvellement à usage unique (rotation).
  Ancien jeton rejoué ≤ 10 s : `refresh_race` ; entre 10 s et 10 min : réponse perdue, nouvelle paire émise sans prolonger la fenêtre ; au-delà : famille révoquée.
  Compromis : la détection de vol par réutilisation est affaiblie pendant 10 min. Déconnexion : révocation.
- **E-mail** : un seul e-mail, le code de connexion. Un e-mail n'est `sent` que si GAS répond `{ok:true}`. Tous les comptes
  sont vérifiés dès leur création (le code l'a prouvé) ; le contrôle « adresse vérifiée » sur les routes sensibles est conservé
  par prudence (il ne peut plus refuser que des comptes créés avant la v5).
- **Appareils** : chaque session porte un libellé tiré du User-Agent (« Chrome · Android », sans empreinte précise) ;
  liste et révocation par appareil.
- **Bots** : 2 bots actifs au maximum par membre. Un bot Telegram n'est actif que pour un seul compte
  (index unique partiel). Jeton chiffré AES-256-GCM, jamais renvoyé. `drop_pending_updates` à `false`
  par défaut. Déconnexion : webhook retiré (s'il est encore le nôtre), jeton Botgram effacé, historique
  Botgram effacé, fiche gardée, jeton Telegram non révoqué. Suppression de fiche seulement après
  déconnexion.
- **Messages** : `sent` si et seulement si Telegram rend un `message_id`. Échec temporaire (429, 5xx) sur un
  texte : `queued`, puis **le membre** appuie sur « Réessayer » (`POST /messages/:id/retry`, jamais avant 1, 5 puis 15 minutes,
  3 réessais au maximum ; décision du propriétaire : pas de tâche planifiée à la minute). Un média ou un album en échec
  temporaire passe directement en `failed`. Échec permanent : `failed`. Réponse perdue : `unknown`, jamais
  réessayé automatiquement.
- **Mise en forme** (colonne `parse_mode`) : `parse_mode` = `HTML` ou `MarkdownV2`, jamais `Markdown` (historique, ambigu). Le texte est stocké tel
  qu'envoyé (balises comprises) avec son `parse_mode` : une seule vérité, rejouée telle quelle par « Réessayer ». Le Worker n'analyse ni
  n'échappe le balisage : Telegram est seul juge, un refus donne `failed` / `parse_error`. Pas encore de mise en forme des albums.
- **Boutons inline** (colonne `buttons`, contrat : `BUTTONS.md`) : clavier inline seulement (liens et `callback_data`), pas de clavier de réponse, pas de
  `web_app` / `login_url` / `copy_text` (surface d'attaque et de validation plus large, à décider au cas par cas). Le clavier est stocké en JSON dans
  `messages.buttons`, validé à l'entrée avec les plafonds de Telegram (8 par ligne, 100 au total, `callback_data` de 1 à 64 **octets**), schémas d'URL limités à
  `https`, `http`, `tg`. **Modifier un message conserve son clavier** : Telegram le retire quand `reply_markup` est omis, le Worker le repasse donc
  lui-même ; `buttons: []` est la seule façon de le retirer. Un clic est un message entrant `callback_query` **rattaché au message d'origine** par le mécanisme
  de réponse existant (aucune colonne de plus) ; l'intitulé du bouton est retrouvé à la lecture dans le clavier du message d'origine. Acquittement toujours
  automatique et sans texte (le membre n'est pas là à la seconde) ; une réponse personnalisée au clic reste possible plus tard (clé `answer` par bouton, non faite).
  Pas de clavier sur les albums (Telegram ne le permet pas). L'auteur d'un clic en groupe n'est pas conservé.
- **Transfert, copie, réaction, épinglage** (colonnes de `messages`, contrat : `MESSAGE-ACTIONS.md`). Transfert et copie créent un **nouveau message sortant** : ils consomment une
  unité de quota (c'est un envoi), suivent le cycle sent / failed / unknown, et ne sont **jamais mis en file** (« Réessayer » ne sait renvoyer qu'un texte : il enverrait autre
  chose qu'un transfert). Destination limitée au **même bot** (un `file_id` n'est valable que pour son bot). Le clavier du source n'est pas repris. Réaction et épinglage changent
  un message existant : hors quota, idempotents, comptés dans le garde-fou d'abus. **Une seule réaction du bot** par message. Réactions reçues : emoji d'un utilisateur identifié
  seulement, stockées par utilisateur (JSON sur le message, mise à jour atomique par `json_set` / `json_remove`), exposées en **totaux par emoji** ; événement plus ancien ignoré.
  `pinned_at` n'est que ce que Botgram a fait (les épinglages faits dans Telegram ne sont pas suivis). Ajouter `message_reaction` à `allowed_updates` ne touche pas les bots déjà
  connectés : d'où `POST /bots/:id/resync-webhook`, explicite, à appeler une fois par bot après déploiement (il renouvelle le secret, faute de pouvoir le relire : il n'est stocké qu'en HMAC).
- **Modification et suppression** : seulement les messages **sortants** (un message reçu n'est jamais touché, même si Telegram permet de
  supprimer un message entrant en privé : décision prudente, on n'efface pas ce que l'interlocuteur a écrit). Appels idempotents, donc
  jamais de statut `unknown` : une réponse perdue est une erreur à rejouer. Hors quota, mais un refus de Telegram compte dans le
  garde-fou d'abus. La suppression est un effacement réel dans Botgram (pas de trace « supprimé »), refusée au-delà de 48 h (limite de
  Telegram) et pour `queued` / `sending` / `unknown`. Le quota consommé n'est pas rendu (sinon : envoyer puis supprimer contournerait le plafond).
- **Quota** : 165 envois initiaux par membre et par jour UTC, partagés entre les deux bots, réservés
  avant l'appel (contrôle du plafond et incrément dans une seule instruction SQL), confirmés si `sent`
  ou `unknown`, libérés si `failed`. Édition et suppression hors quota.
- **Garde-fou d'abus** (séparé du quota) : 30 envois non acceptés par heure et par membre, puis refus
  sans appel Telegram.
- **Rétention** : 30 jours via `expires_at` sur chaque message (entrant : enregistrement Botgram ;
  sortant : enregistrement de la ligne d'envoi). Purge toutes les 3 heures. Audit : 365 jours, sans
  contenu de message ni `file_id`.

## 3. Écarts par rapport aux anciens documents

1. **Pas de R2.** Les photos de demande et copies de médias disparaissent. Une pièce jointe reçue est téléchargée à la
   demande chez Telegram (`getFile`) et relayée sans copie ni URL. **Exception : la photo de profil des contacts**, rangée
   dans Google Drive par la passerelle GAS (`docs/CONTACTS-DRIVE.md`), collectée en tâche de fond à la première apparition du contact.
2. **Pas de « demande de création de bot par un administrateur »** (doc 01 parcours A, doc 04). Les docs 15 et
   16 ne la prévoient plus : le membre crée son bot chez @BotFather et l'associe avec son jeton.
3. **Édition du profil Telegram du bot : présente.** Les routes `/bots/:id/profile…` (nom, descriptions, commandes, menu,
   droits) et `/bots/:id/files/…` existent (`src/routes/profile.js`, `src/domains/bot-profile.js`). Ce point disait le
   contraire dans une version précédente de ce document.
4. **Langue, fuseau, thème, photo : côté frontend** (aucun appel pour un réglage d'affichage). Le Worker garde seulement le profil métier
   (`country`, `usage`, `phone`, `organization`), dont le téléphone obligatoire pour de futures actions. Pays et usages : listes du frontend.
5. **Secret de webhook : stocké sous forme de HMAC**, pas chiffré (doc 15/16 disait « chiffré »). Seule la
   comparaison est nécessaire ; un secret perdu se régénère (`retry-webhook`). Plus fort au repos : il ne
   peut pas être déchiffré. **Changement de secret en trois temps** (`retry-webhook`, `resync-webhook`) : le nouveau secret est d'abord
   `pending` (déjà accepté), l'ancien reste valable tant que Telegram n'a pas confirmé, puis l'ancien reste accepté 1 heure après la
   confirmation (`WEBHOOK_SECRET_GRACE_MS`). Un échec de `setWebhook` ne coupe donc jamais un bot connecté et ne change pas son état
   (sauf `token_invalid`). Ces deux routes sont limitées à 10 appels par heure et par membre.
6. **Réponse perdue d'un envoi = `unknown`, y compris « réseau coupé »** : le doc 13 classait « réseau
   coupé » en temporaire. Une connexion qui échoue sans réponse ne prouve pas que la requête n'est pas
   partie ; réessayer risquerait un doublon. Seuls 429 et 5xx (réponse reçue) sont réessayés. Les lectures
   (`getMe`, `getWebhookInfo`, `setWebhook`, `deleteWebhook`) sont idempotentes et traitées comme temporaires.
7. **Déconnexion : l'historique est effacé dans la même requête** (docs 15/16), et non conservé comme dans
   le doc 06.
8. **Route ajoutée : `POST /bots/:id/retry-webhook`.** Si `setWebhook` échoue après l'insertion de la fiche,
   la fiche reste (`webhook_error`) et le membre relance la pose avec un nouveau secret. Supprimer la fiche
   et appeler `deleteWebhook` en secours aurait pu retirer le webhook d'un tiers.
9. **Idempotence d'envoi côté client** : champ optionnel `client_message_id` (unique par bot). Un nouvel
   essai du même envoi (réseau mobile instable) ne crée ni doublon, ni second appel Telegram, ni seconde unité.
10. **Deux modes de transport des jetons.** Défaut : cookies `__Host-` HttpOnly. Si le frontend est sur un
    autre *site* que le Worker (ex. `frontend.example` et `worker.example`, qui sont des suffixes publics), le navigateur ne renvoie
    pas des cookies `SameSite=Lax` et beaucoup bloquent les cookies tiers : le frontend envoie alors `X-Token-Mode: body` et reçoit
    les jetons dans le JSON (à envoyer ensuite en `Authorization: Bearer`). `COOKIE_SAMESITE` vaut `auto` par défaut : `None`
    (avec `Partitioned`) entre sites différents, `Lax` sur le même site ; une valeur explicite est respectée. `GET /health` renvoie
    `token_mode` (`cookie` ou `body`) : le mode conseillé au frontend. Solution la plus propre : un domaine commun
    (`app.exemple.com` et `api.exemple.com`) avec les cookies.
11. **CSRF** : toute requête qui modifie quelque chose doit avoir `Origin` = `APP_ORIGIN` ; avec un cookie
    d'authentification, l'en-tête `Origin` est obligatoire.
12. **Clé de chiffrement** : `TOKEN_ENC_KEY_V<n>` est un texte aléatoire d'au moins 32 caractères dont la clé
    AES-256 est dérivée (SHA-256), au lieu de 32 octets bruts en base64 : on la génère avec un simple
    gestionnaire de mots de passe. La version est inscrite dans chaque chiffré (`v1.…`) ; la rotation
    consiste à ajouter `TOKEN_ENC_KEY_V2` et `TOKEN_ENC_KEY_CURRENT=2` (un job de rechiffrement reste à écrire
    le jour où la rotation sera nécessaire).
13. **Un seul secret `PEPPER`** avec séparation de domaine (`tok:`, `wh:`, `code:`) au lieu de plusieurs peppers.
14. **Webhook : un bot inconnu répond 401** comme un secret invalide (le doc 07 disait 404) : pas d'énumération.
15. **Limites de débit** : demandes de code 10 par IP et par 15 min, 3 par adresse et par heure ; codes faux 20 par IP et par
    15 min (en plus des 5 essais par code), car des réseaux mobiles partagent une même IP ; création de compte 5 par IP et par 15 min.
16. **Plafond de fiches** : 10 fiches (actives + déconnectées) par membre, pour borner la table.
17. **Administration** : lecture des membres, activation/désactivation (jamais d'un administrateur, jamais de
    soi-même), lecture de l'audit. Le premier administrateur est créé par l'opérateur (voir README), jamais
    par une route publique.

## 4. Points de vigilance

- **CPU Workers Free (10 ms).** Plus aucun hachage lourd dans le Worker : un code coûte un HMAC (microsecondes).
- **Quota d'e-mails.** Voir §2. Si le volume de connexions dépasse la centaine par jour, remplacer GAS par un fournisseur
  d'e-mail à API appelé depuis le Worker : seul `src/adapters/gas.js` (`sendEmail`) change. Les photos de contacts restent sur Drive.
- **Débit de la purge.** Une seule tâche planifiée, toutes les 3 heures, 500 messages par passage = 4 000 par jour
  (`PURGE_BATCH`, maximum 500 : au-delà D1 reste verrouillé en écriture trop longtemps). Au-delà de ce volume entrant,
  la purge prend du retard. Les lectures ignorent les messages échus (`expires_at`), donc la durée de 30 jours est exacte
  même entre deux passages. Le nettoyage technique (sessions, jetons, compteurs, audit) traite 500 lignes par passage. D1 Free limite aussi
  les écritures à 100 000 par jour (chaque message coûte une écriture à l'insertion, une à la suppression,
  plus ses index).
- **Quota GAS.** Un compte Gmail gratuit envoie environ 100 e-mails par jour, un compte Workspace environ 1 500.
  GAS répond `quota` quand il est atteint ; l'e-mail passe alors en `failed` et le membre peut redemander un envoi.
- **Un appel Telegram `unknown`** consomme une unité de quota même si le message n'est jamais parti. C'est voulu
  (doc 13) : mieux vaut compter trop que laisser contourner le plafond.
- **Intervalle de 2 minutes** (`SENDING_STALE_MS`) : un envoi resté « en cours » au-delà est déclaré `unknown`
  à la lecture de la conversation ou au « Réessayer » (plus de tâche planifiée). Un appel Telegram dure normalement moins de 10 secondes.
- **Écritures D1 et index.** Chaque entrée d'index modifiée compte comme une ligne écrite : la table `messages`
  a beaucoup d'index, donc un message coûte environ 15 écritures sur sa vie (insertion, mises à jour, purge à 30 jours).
  `ix_messages_text` (doublon de `ix_messages_conversation`) et `ix_conversations_bot_last` (jamais choisi) sont retirés.
  La déconnexion d'un bot supprime les conversations (les messages partent en cascade par l'index `conversation_id`) au lieu de
  `DELETE FROM messages WHERE bot_id = ?`, qui parcourait toute la table. Le schéma d'une base neuve tient en 5 petits fichiers dans `migrations/`
  (`0001_comptes` … `0005_quota_notifications_audit`, à exécuter dans l'ordre, faciles à coller dans la Console D1), que `test/helpers/fake-d1.js`
  charge dans l'ordre. Toute évolution ultérieure ajoute un fichier numéroté (additif : `ALTER TABLE … ADD COLUMN`, sans `BEGIN`/`COMMIT`,
  que D1 refuse) et un script correspondant dans `upgrade/` pour les bases existantes.

## 5. Historique des révisions

- **Schéma regroupé.** Les anciennes migrations 0001 à 0011 sont fusionnées dans `migrations/` (découpé ensuite en 5 fichiers, schéma identique, vérifié table par table) (même schéma, plus les colonnes
  de rotation du secret de webhook). Raisons : la 0002 contenait `BEGIN`/`COMMIT` et recopiait la table des messages, ce que D1 refuse ;
  rien n'était encore en production. Une base déjà créée avec les anciennes migrations reçoit seulement les trois `ALTER TABLE` du README.
- **Photos de contacts** : plus aucune API Node (`Buffer`) dans `src/` — Workers n'a pas `Buffer` sans `nodejs_compat`. Un test interdit
  `Buffer`, `process` et `require` dans `src/`.
- **Cookies** : `COOKIE_SAMESITE=auto` et `token_mode` dans `/health` (voir §3.10).
- **Secret de webhook** : changement en trois temps avec période de grâce (voir §3.5).
- **Connexion par code** : essais comptés atomiquement (plus de rafale parallèle au-delà de 5), envoi échoué = quotas remboursés et pas de délai.
- **Recherche** : 30 par minute et par membre ; liste des conversations en un seul accès au dernier message.
- **E-mails** : adaptateur Brevo facultatif (`docs/BREVO.md`) ; `deps.mailer` choisit Brevo si clé et expéditeur sont posés, sinon Google.
- **Notifications et temps réel** : pas d'interrogation permanente (elle épuiserait les 100 000 requêtes/jour de la formule gratuite). Le push Firebase
  déclenche UN appel `/updates` ; filet lent de 2 min conversation affichée. Non lus = compteur sur la conversation (une écriture par message).
  Firebase direct (pas d'Expo : compte supplémentaire). Aperçu du message dans la notification, au plus une toutes les 30 s par conversation.
- **Suppression de compte** : confirmée par un code envoyé à l'adresse du compte (même mécanisme que la connexion, pas de mot de passe). Bots
  déconnectés puis photos Drive supprimées AVANT l'effacement ; en cas d'échec le compte reste et le code reste valable (réessai possible).
  Exigée par Google Play pour toute application qui crée des comptes.
- **Notifications et sessions** : un jeton Firebase est lié à sa session ; révoquer la session retire le jeton. Sourdine au niveau du bot seulement.
- **Photo d'un bot** : lue chez Telegram à la demande (`GET /bots/:id/photo`) avec cache Cloudflare d'une heure (domaine personnalisé seulement) et
  cache navigateur ; pas de Drive (photo publique, rarement modifiée, quelques bots par membre). Changement de photo : multipart JPEG
  (Telegram refuse `file_id` et adresses) ; l'ancienne route JSON ne pouvait pas fonctionner.
- **Contacts/photos** : purge à 30 jours d'inactivité sans conversation, photo Drive supprimée avant la ligne (§ README « Purge »).
  Compromis : si la passerelle est indisponible, les contacts concernés attendent (et la fiche du bot ne peut pas être supprimée).
- **Turso (phase 1)** : `deps.hot` = Turso si configuré, sinon D1 (même objet que `deps.db`). Y vont les compteurs de débit à fort volume et l'audit ;
  les compteurs de connexion/inscription restent en D1. Compteurs : panne de Turso = on laisse passer. Audit : panne = écriture en D1, lecture des deux bases.
  Adaptateur sans dépendance (API HTTP pipeline), `batch` en un seul appel, disjoncteur et plafond de 30 appels par invocation (voir `docs/TURSO.md`).
- **v15.1 — Turso pour les messages (phases 2 et 3)** : `deps.msg` = Turso si `TURSO_MESSAGES=1`, sinon D1. Conversations, contacts et messages y vont ;
  `quota_usage` reste en D1 (choix du propriétaire), comme les comptes, sessions, bots, jetons, codes de connexion et appareils.
  Pas de jointure entre bases : la propriété d'un bot se vérifie dans D1 (`ownedBotStatus`), puis la requête Turso est filtrée par `bot_id`
  (`/updates` : identifiants des bots du membre lus dans D1, puis `IN (...)`). Pas de clé étrangère côté Turso : déconnexion d'un bot, suppression
  de la fiche et du compte, et suppression des contacts effacent explicitement messages, conversations et contacts (`contact_id` remis à NULL).
  Pas de transaction entre les deux bases : on écrit d'abord l'historique (Turso), puis les comptes (D1) ; chaque opération est rejouable.
  Turso en panne : l'API répond 503 `SERVICE_UNAVAILABLE` (Retry-After 30) et le webhook répond une erreur (Telegram réessaie ; un doublon est ignoré).
  Aucune reprise automatique des données restées en D1 : voir `docs/TURSO.md`.
- **v15.1.1** : `tools/turso-setup.js` (création des tables Turso par l'API HTTP, sans CLI, et diagnostic de bout en bout avec l'adaptateur du Worker) ; aucun changement du Worker.
- **v15.1.2** : workflow GitHub Actions manuel `turso-setup.yml` (lance `tools/turso-setup.js` avec les secrets du dépôt), pour créer les tables sans terminal.
- **v15.2 — versions de l'application mobile** : registre `app_releases` par (plateforme, canal, build) ; identité de l'application dans les en-têtes `X-App-*`,
  mémorisée sur la session. Le minimum supporté est propre à chaque canal (une boutique valide plus tard que GitHub : jamais d'obligation là où le build n'est pas disponible) ;
  retirer un build lève son exigence. Pas d'interrogation à chaque ouverture : l'information voyage dans les réponses existantes (`X-App-Update`), par un sujet Firebase
  par canal (un seul envoi) et par `GET /app/updates`. 426 sur les routes de membre seulement (jamais sur les routes publiques, la déconnexion, `/push/unregister`).
  Publication par la compilation (`POST /ci/releases`, secret `RELEASE_PUBLISH_TOKEN`, rejouable) ; le Worker ne télécharge pas l'APK : adresse bornée par `RELEASE_URL_PREFIX`,
  empreinte et taille obligatoires pour les canaux fichier, et Android refuse de toute façon une signature différente. Cache du registre 5 min par isolat, panne = pas de blocage.
  Mise à jour de la base : `upgrade/D-v15.1-vers-v15.2.sql` à exécuter AVANT le déploiement. Session portée à 180 jours / 2 h (voir « Session »).
