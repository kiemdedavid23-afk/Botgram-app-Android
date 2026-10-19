# Notifications push (Android, Firebase)

## Principe

1. Un contact écrit au bot → Telegram appelle le webhook → le message est enregistré, le compteur de non lus de la conversation augmente.
2. Si le propriétaire du bot a des appareils enregistrés, le Worker envoie, en tâche de fond, une notification à Firebase (FCM) :
   **titre** = nom de l'expéditeur (groupe : « expéditeur · groupe »), **texte** = aperçu du message (120 caractères, pièces jointes : 📷 Photo…),
   **données** = `type`, `bot_id`, `conversation_id` (pour ouvrir la bonne conversation au toucher).
3. Au plus **une notification par 30 s et par conversation**. Aucun envoi pour un clic de bouton ni pour un doublon de Telegram.
4. Firebase répond « appareil inconnu » (application désinstallée) → le jeton est supprimé automatiquement.
5. Une panne de Firebase ne fait jamais échouer le webhook : la notification est perdue, **jamais le message** (l'application relit `/updates`).

Pas d'interrogation permanente : l'application s'actualise **à la réception de la notification** (un seul appel `GET /updates`), à
l'ouverture, au retour au premier plan, et par un filet lent (toutes les 2 minutes, conversation affichée).

⚠️ Le nom et l'aperçu des messages transitent par Firebase (Google) pour arriver sur le téléphone. C'est le choix retenu ; pour ne plus
montrer d'aperçu, il suffit de changer `notificationContent` dans `src/domains/push.js`.

## Appareil perdu, sourdine

- Chaque appareil notifié est lié à la session qui l'a enregistré. Si le membre déconnecte cet appareil depuis la liste des appareils (ou
  « tout déconnecter »), le Worker supprime son jeton : le téléphone perdu ne reçoit plus d'aperçu de message. Même un jeton resté en base est
  ignoré si sa session est révoquée ou expirée.
- Sourdine : `PATCH /bots/:id { muted: true }` coupe les notifications de ce bot. Les messages sont reçus et comptés comme non lus.

## Mise en place côté Firebase (une fois)

1. <https://console.firebase.google.com> → **Ajouter un projet** (gratuit, sans Analytics).
2. **Ajouter une application Android** : nom de paquet = celui de l'application (ex. `com.votrenom.botgram`). Télécharger **`google-services.json`**.
3. **Paramètres du projet → Comptes de service → Générer une nouvelle clé privée** : un fichier JSON est téléchargé. C'est le secret du Worker.

## Côté Worker

```
npx wrangler secret put FCM_SERVICE_ACCOUNT      # coller TOUT le contenu du fichier JSON du compte de service
```
Sans ce secret, les notifications sont simplement désactivées (non lus et `/updates` fonctionnent quand même). Ne jamais mettre ce fichier dans
le dépôt. Vérifier : un message reçu avec un appareil enregistré doit produire une notification ; sinon consulter les journaux du Worker
(`push` : raison `fcm_auth`, `fcm_403_…`, etc.).

## Côté application (React Native, compilée par GitHub Actions)

- `google-services.json` va dans `android/app/`. Ne pas le commiter en clair si vous préférez : le stocker en secret GitHub (base64) et le
  recréer dans le workflow avant la construction.
- Bibliothèque conseillée : `@react-native-firebase/app` + `@react-native-firebase/messaging` (jeton FCM = `messaging().getToken()`), avec
  `notifee` ou équivalent pour créer le **canal Android `messages`** (importance haute) : le Worker envoie vers ce canal.
- À chaque démarrage et à chaque `onTokenRefresh` : `POST /push/register { token, platform: "fcm", device }`. Avant la déconnexion :
  `POST /push/unregister { token }`.
- Notification reçue **application ouverte** (`onMessage`) : appeler `GET /updates?since=<server_time précédent>`, fusionner, remonter les
  conversations changées. Application **en arrière-plan** : Android affiche la notification ; au toucher (`onNotificationOpenedApp`,
  `getInitialNotification`), ouvrir `conversation_id`.
- Permission : Android 13+ demande `POST_NOTIFICATIONS` ; la demander après la connexion du premier bot, pas au lancement.

## Limites connues

- 5 appareils notifiés par membre (le plus ancien est remplacé).
- Android seulement pour l'instant (`platform` accepte uniquement `fcm`) ; iPhone demandera un compte Apple payant et la même route.
- Une lecture faite depuis un autre appareil ne remonte pas dans `conversations` de `/updates` (le total `unread` par bot, lui, est exact).
