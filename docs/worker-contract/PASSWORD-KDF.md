> **Statut : réservé, non utilisé depuis la v5.** Botgram se connecte par code e-mail, sans mot de passe (`docs/API.md`).
> Ce document et `tools/derive-password-key.js` décrivent la dérivation prévue pour un **mot de passe 2FA facultatif** ajouté
> plus tard (comme le « mot de passe cloud » de Telegram). Le Worker n'a plus aucun code correspondant : il faudra l'écrire
> (colonne dédiée, routes, pepper versionné) le jour venu. Les routes et secrets cités ci-dessous n'existent plus.

# Mots de passe : dérivation dans le navigateur

Ce document fait partie du contrat du frontend. Le frontend n'envoie **jamais** le mot de passe au Worker.

## Pourquoi

Le plan gratuit de Cloudflare Workers limite le CPU à 10 ms par requête. Un hachage PBKDF2 sérieux (600 000 itérations,
recommandation OWASP) demande plusieurs centaines de millisecondes : impossible dans le Worker. Un navigateur le fait
en 0,3 à 2 s. Le navigateur calcule donc la partie coûteuse ; le Worker ajoute sa propre protection (HMAC + pepper secret).

## Ce que fait le frontend

```
password_key = base64url_sans_remplissage( PBKDF2-HMAC-SHA-256(
    mot de passe : UTF-8 de password.normalize('NFKC'),
    sel          : UTF-8 de "botgram:kdf:v1:" + email.trim().toLowerCase(),
    itérations   : 600 000,
    longueur     : 256 bits ) )
```

Code de référence (navigateur et Node ≥ 20) : `tools/derive-password-key.js`, fonction `derivePasswordKey(email, password)`.
Résultat : 43 caractères `[A-Za-z0-9_-]`. À envoyer avec `kdf: "pbkdf2-sha256-600k-v1"`.

| Écran | Corps envoyé |
|---|---|
| Inscription | `{ email, password_key, kdf, display_name, ui_language? }` |
| Connexion | `{ email, password_key, kdf }` |
| Changement de mot de passe | `{ current_password_key, new_password_key, kdf }` (les deux clés avec l'adresse **du compte**) |
| Réinitialisation | `{ token, new_password_key, kdf }` (clé calculée avec l'adresse lue dans le lien) |

Règles à appliquer **dans le frontend** (le Worker ne peut plus les contrôler) : mot de passe de 12 à 128 caractères,
champ de confirmation, indicateur de force. Afficher un indicateur de progression pendant le calcul (jusqu'à 2 s sur un
téléphone modeste) et le faire dans un Web Worker si l'interface doit rester fluide.

**Piège principal : l'adresse sert de sel.** Si l'adresse d'un compte change un jour, la clé change : prévoir alors une
réinitialisation de mot de passe, pas un simple changement d'adresse. Casse et espaces ne comptent pas (normalisés).

### Réinitialisation
Le lien de l'e-mail est `<APP_ORIGIN>/reset-password#token=…&email=<adresse encodée>`. La page lit les deux valeurs dans
`location.hash` (`URLSearchParams`), dérive la clé avec cette adresse, envoie, puis efface le fragment.

### Vecteur de test (à reproduire dans les tests du frontend)
- adresse : ` Alice@Example.com ` (avec espaces et majuscules : normalisée en `alice@example.com`)
- mot de passe : `correct horse battery staple`
- `password_key` : `MUUxovT61p6gt84XcGevIYzuwl3CJ8wkVPqztOgb3F8`

Ce vecteur a été vérifié avec une implémentation indépendante (Python `hashlib.pbkdf2_hmac`).

## Ce que fait le Worker

Il valide la forme (43 caractères base64url, `kdf` connu), puis stocke
`pw2$k1$p<version du pepper>$<sel>$<HMAC-SHA-256(pepper, "pw2:" + sel + ":" + password_key)>`, avec un sel aléatoire par compte.
Un compte inconnu suit le même chemin de calcul (pas d'oracle sur l'existence des comptes).

## Limites assumées

- **Le Worker ne peut pas vérifier le nombre d'itérations** réellement faites par le client. Un client modifié peut envoyer une
  clé faible ; il n'affaiblit que son propre compte. En cas de vol de la base, un attaquant devrait de toute façon connaître le
  pepper pour tester des candidats, puis payer 600 000 itérations par essai.
- **Le « mot de passe » réel devient la clé.** Quiconque intercepte la clé peut se connecter, exactement comme avec un mot de
  passe en clair : HTTPS reste obligatoire. Le gain concerne le coût de calcul et l'absence de mot de passe en clair dans les
  journaux ou la mémoire du Worker, pas la sécurité du canal.
- **Pas de changement d'algorithme sans migration.** `kdf` et `k1` identifient la version. Passer un jour à une dérivation plus
  forte demandera une route indiquant au client quelle version utiliser pour une adresse donnée (à créer à ce moment-là).

## Rotation du pepper de mots de passe

1. Ajouter le secret `PASSWORD_PEPPER_V2` (32 caractères ou plus) et passer `PASSWORD_PEPPER_CURRENT` à `2`. **Conserver `PASSWORD_PEPPER_V1`.**
2. Chaque membre qui se connecte voit son empreinte refaite avec V2 automatiquement.
3. Quand plus personne n'a d'empreinte `p1` (`SELECT COUNT(*) FROM members WHERE password_hash LIKE 'pw2$k1$p1$%'` retourne 0),
   supprimer `PASSWORD_PEPPER_V1`. Les comptes qui ne se sont pas reconnectés d'ici là passent par « mot de passe oublié ».

Perdre un pepper sans l'avoir remplacé rend les comptes concernés inutilisables (la connexion est refusée, jamais en erreur).
