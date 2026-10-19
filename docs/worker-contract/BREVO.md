# E-mails de connexion par Brevo

Alternative à la passerelle Google : les codes de connexion partent par l'API Brevo (plafond gratuit : 300 e-mails par jour, contre
~100 pour Gmail). La passerelle Google reste nécessaire **uniquement pour les photos de contacts** (Drive).

## Activation

Poser trois valeurs côté Worker (la clé en secret, jamais dans `wrangler.toml` ni dans le code) :

| Nom | Rôle |
|---|---|
| `BREVO_API_KEY` | la clé API Brevo (secret : `npx wrangler secret put BREVO_API_KEY`) |
| `BREVO_SENDER_EMAIL` | l'adresse d'expéditeur, **déjà validée dans Brevo** |
| `BREVO_SENDER_NAME` | facultatif, nom affiché (défaut « Botgram ») |

Si la clé OU l'expéditeur manque, les e-mails repartent par la passerelle Google comme avant (aucune erreur).
Conseil : monter `EMAIL_DAILY_LIMIT` (ex. 250) pour profiter du plafond Brevo.

## Expéditeur en @gmail.com (sans domaine)

1. Brevo → *Expéditeurs, domaines et IP* → *Expéditeurs* → ajouter l'adresse Gmail → saisir le code de validation reçu.
2. Brevo ne peut pas authentifier gmail.com : il remplace lui-même la partie après le @ par un de ses domaines partagés
   (`brevosend.com`). Rien à configurer ; les e-mails arrivent donc d'une adresse `…@….brevosend.com`.
3. Risque : plus de courriers en spam qu'avec un domaine à soi. À tester sur les boîtes réelles. La solution durable est d'acheter un
   domaine et de l'authentifier dans Brevo.

## Erreurs enregistrées (`login_codes.send_error`)

`brevo_quota` (429, plafond atteint : le plafond du jour reste consommé), `brevo_401_unauthorized` (clé fausse),
`brevo_400_…` (souvent expéditeur non validé), `brevo_unreachable`, `not_configured`. Tout échec rembourse les demandes de l'utilisateur
(sauf `*_quota`). La clé n'apparaît jamais dans ces raisons.
