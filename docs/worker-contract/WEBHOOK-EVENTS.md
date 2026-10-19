# Événements webhook — politique

## Demandés à Telegram (`allowed_updates`)

| Type | Traitement |
|------|------------|
| `message` | Texte, photo, document, et médias avec `file_id` (vidéo, animation, audio, voix, video_note, sticker). Autres contenus de message : `other` sans pièce jointe. |
| `edited_message` | Mise à jour du message existant (texte + pièces jointes si fournies). Pas de doublon si le message est déjà connu. |
| `callback_query` | Enregistré, rattaché au message portant le bouton. Accusé `answerCallbackQuery` séparé de l’enregistrement. Aucune action métier automatique. |
| `message_reaction` | Met à jour les compteurs de réactions du message (par utilisateur, emoji seulement). N’écrit aucun nouveau message. Les bots connectés avant son ajout doivent être resynchronisés (`POST /bots/:id/resync-webhook`, voir `MESSAGE-ACTIONS.md`). |

## Volontairement exclus (non demandés)

`channel_post`, `edited_channel_post`, `message_reaction_count`, `poll`, `poll_answer`,
`chat_member`, `my_chat_member`, `chat_join_request`, `inline_query`,
`chosen_inline_result`, `shipping_query`, `pre_checkout_query`, événements business.

S’ils arrivent malgré tout : authentification, puis 200 sans écriture. Pas de fausse action.

## HTTP

- Secret invalide : 401.
- Écriture réussie ou doublon `update_id` : 200.
- Erreur D1 : 500, Telegram réessaie ; la contrainte unique évite le double enregistrement.
