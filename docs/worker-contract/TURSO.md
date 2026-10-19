# Turso : base des écritures fréquentes (v15.1)

Turso est **facultatif** et s'active en deux étapes indépendantes. Sans `TURSO_URL` et `TURSO_AUTH_TOKEN`, tout reste en D1 et rien ne change.

## Pourquoi
Le plan gratuit de D1 plafonne à 100 000 lignes écrites par jour. Le plan gratuit de Turso (page officielle de tarification, à revérifier) donne
environ 10 millions de lignes écrites par mois (environ 330 000 par jour), 500 millions de lignes lues par mois, 5 Go, et ne met plus les bases en
veille. Ce que Turso fait au-delà du quota gratuit (blocage ou facturation) n'est pas clairement documenté : le vérifier dans le compte Turso.

## Ce qui va où
| Donnée | Base |
|---|---|
| Compteurs de connexion et d'inscription : `code:ip:`, `code:email:`, `code-fail:ip:`, `register:`, `email-day` | **D1** (rares, et ils protègent le quota d'e-mails même si Turso tombe) |
| Autres compteurs : `updates:`, `search:`, `push:conv:`, `push-register:`, `bot-photo:`, `bot-photo-set:`, `preview:`, `link:`, `webhook:`, `sendfail:` | **Turso** (étape 1) |
| Journal d'audit | **Turso** (étape 1 ; repli sur D1 si Turso échoue) |
| Conversations, contacts, messages | **Turso** seulement si `TURSO_MESSAGES = "1"` (étape 2) |
| Membres, sessions, bots, jetons chiffrés, codes de connexion, appareils notifiés, **quota quotidien** | **D1** |

## Mise en place
1. **Créer la base** (tableau de bord Turso, ou CLI `turso db create botgram`). Type **libSQL** : ne pas utiliser l'option `--tursodb` (autre moteur : l'adaptateur est écrit pour le protocole libSQL).
   Région : la plus proche du Worker (Cloudflare place le Worker près de l'utilisateur ; choisir la région où se trouvent la plupart de tes membres).
2. **Récupérer l'URL** : `libsql://<base>-<compte>.turso.io` (tableau de bord, ou `turso db show botgram --url`).
3. **Créer un jeton** (tableau de bord, ou `turso db tokens create botgram`). Il se montre une seule fois : le garder.
4. **Créer les tables et tout vérifier** avec le script fourni (Node 18 ou plus, aucune installation) :
   `TURSO_URL="libsql://..." TURSO_AUTH_TOKEN="..." node tools/turso-setup.js`
   Il applique `turso/schema.sql`, puis teste avec le même code que le Worker : écriture, transaction en un appel, annulation en cas d'échec. Rejouable ; `--check` vérifie sans rien créer.
   Sans ordinateur, deux possibilités :
   - **GitHub Actions** (conseillé : rien à taper) : ajouter les secrets du dépôt `TURSO_URL` et `TURSO_AUTH_TOKEN` (Settings → Secrets and variables → Actions), puis onglet Actions → « Turso setup » → Run workflow (`.github/workflows/turso-setup.yml`). Si le projet n'est pas à la racine du dépôt, ajouter `working-directory` à l'étape.
   - **Termux** (Android) : `pkg install nodejs git`, `git clone` du dépôt, puis `read -s TURSO_AUTH_TOKEN; export TURSO_AUTH_TOKEN; export TURSO_URL="libsql://..."; node tools/turso-setup.js` (le jeton saisi avec `read -s` n'est ni affiché ni gardé dans l'historique).
   (Autre alternative : `turso db shell botgram < turso/schema.sql`, mais sans les vérifications.)
5. Dans `wrangler.toml`, section `[vars]` : `TURSO_URL = "..."` ; secret : `npx wrangler secret put TURSO_AUTH_TOKEN` (ou Cloudflare → le Worker → Paramètres → Variables et secrets).
6. Redéployer : l'étape 1 est active. **Étape 2** : poser `TURSO_MESSAGES = "1"` et redéployer (lire « Reprise des données » ci-dessous si le Worker a déjà servi).

Les variables vont ensemble : `TURSO_URL` sans jeton (ou l'inverse), une URL invalide, ou `TURSO_MESSAGES` sans Turso empêche le Worker de démarrer (message « Configuration invalide »).
Retour en arrière : retirer `TURSO_MESSAGES` (ou `TURSO_URL`) et redéployer.

## Reprise des données (étape 2)
**Rien n'est recopié automatiquement.** Dès `TURSO_MESSAGES = "1"`, le Worker ne lit plus que Turso : les conversations et messages restés en D1 deviennent invisibles
(la purge de D1 continue à les effacer au bout de 30 jours). Deux possibilités :
- **Activer avant l'usage réel** (rien à reprendre) ou accepter de perdre l'historique des 30 derniers jours (il reste chez Telegram ; seuls les nouveaux messages apparaîtront) ;
- **Recopier** : exporter les trois tables de D1 (`npx wrangler d1 export botgram --remote --no-schema --table contacts --table conversations --table messages --output messages.sql`, options à vérifier avec `--help`),
  appliquer le fichier à Turso (`turso db shell botgram < messages.sql`), vérifier les comptes, puis activer. Les messages reçus entre l'export et l'activation manqueront : faire les deux dans la foulée.

## Comportement en cas de panne de Turso
- **Compteurs** : l'appel est laissé passer (la limite est inactive pendant la panne ; personne n'est bloqué). Les compteurs de connexion sont en D1 et restent actifs.
- **Audit** : la ligne est écrite en D1. La lecture (`GET /v1/admin/audit`) réunit les deux bases, triées du plus récent au plus ancien, sans doublon.
- **Messages (étape 2)** : l'API répond **503** `SERVICE_UNAVAILABLE` avec `Retry-After: 30` (comptes, bots et connexion continuent de marcher). Le webhook Telegram reçoit une erreur : Telegram
  rejoue l'update plus tard, et un doublon est ignoré (un message n'est jamais enregistré deux fois). Aucun message n'est perdu tant que la panne dure moins que la file d'attente de Telegram.
- **Purge** (cron toutes les 3 heures) : le nettoyage de Turso (compteurs, audit, messages et conversations échus) est un seul appel ; s'il échoue, le reste de la purge a lieu et reprend au passage suivant.
- **Disjoncteur** : après une panne réseau, une erreur HTTP ou un refus d'authentification, Turso est ignoré 30 secondes dans cet isolat (pas d'attente à chaque requête). Délai d'un appel : 2,5 secondes.

## Pas de lien entre les deux bases
- Pas de jointure : la propriété d'un bot est vérifiée dans D1, puis Turso est interrogé avec l'identifiant du bot. Une requête de l'API fait donc un appel D1 de plus.
- Pas de clé étrangère côté Turso : déconnecter un bot, supprimer sa fiche ou un compte efface explicitement les messages, conversations et contacts (`contact_id` des conversations remis à NULL
  quand un contact est supprimé). Ordre : historique (Turso) d'abord, puis comptes (D1) : en cas d'échec au milieu, la même demande peut être refaite.
- Pas de transaction entre D1 et Turso : une ligne d'audit peut exister sans que l'action ait abouti, ou l'inverse.

## Sous-requêtes (plan gratuit : 50 appels externes par invocation)
Chaque appel à Turso est un `fetch` : il compte dans cette limite, avec Telegram, Google, Brevo et Firebase (D1 compte dans une autre limite, 1 000). Mesuré avec le faux serveur : un envoi de message fait 7 appels Turso, une lecture de messages 3, la liste des conversations 1,
une réception de message 5 à 7 (photo du contact en arrière-plan comprise). `batch()` envoie plusieurs instructions en **un seul** appel. L'adaptateur refuse d'en faire plus de 35 par invocation (au-delà,
il se comporte comme en cas de panne). La purge des contacts traite au plus 30 photos Drive par passage (une sous-requête chacune) pour rester sous 50.

## Limites connues
- Les index sont indispensables (ils sont dans `turso/schema.sql`) : Turso facture les lignes lues, une requête sans index relit toute la table.
- Les quotas et tarifs de Turso changent : à revérifier sur leur page avant de s'y fier.
- Cette version n'a pas été essayée contre un vrai Turso : l'adaptateur est testé contre un faux serveur qui reproduit l'API HTTP « pipeline ». C'est le rôle de `tools/turso-setup.js` : il confirme, avant tout déploiement, que la vraie base accepte les transactions (requête `batch`, décrite dans la spécification libSQL mais absente de la page de référence de Turso). Ensuite, surveiller les journaux (erreurs « Turso : »).
