# Contrat contacts

## Identifiants Telegram

`conversations.telegram_chat_id` est `INTEGER NOT NULL`.
`contacts.telegram_user_id` est `INTEGER NOT NULL`.
Telegram expose ces ids comme entiers signés 64 bits. SQLite INTEGER les stocke sans perte dans la plage utilisée.
En conversation privée, `chat.id` et l’id utilisateur ont la même valeur. Ce n’est pas la même notion : le contact porte `telegram_user_id`, la conversation porte `telegram_chat_id`.

## Unicité

`UNIQUE (bot_id, telegram_user_id)`.

## Schéma

Les tables `contacts` et `conversations` (y compris `first_name`, `last_name`, `pinned_at`, `photo_file_id`, `contact_id`) sont créées
d'un seul bloc par `migrations/`. Il n'y a plus de retour de remplissage (backfill) ni d'ordre de migrations à respecter :
le schéma unique remplace les anciennes migrations 0001 à 0011.

## Transition

Écriture webhook : upsert contact (`COALESCE` : un champ absent n’efface pas une valeur connue), puis `contact_id` seulement si privé.
Lecture : `contact.first_name` sinon `conversations.first_name` (repli). Idem photo.
Groupe : `contact_id` reste NULL. Un participant `from` peut créer un contact, sans lier la conversation.

## Contrainte `contact_id`

`TEXT REFERENCES contacts(id) ON DELETE SET NULL`.
Supprimer un contact détache les conversations. Supprimer une conversation ne supprime pas le contact (pas de FK inverse).

## Doublons webhook

Contact : conflit unique → mise à jour, pas de seconde ligne.
Message : `ux_messages_update` + `ON CONFLICT DO NOTHING`.
