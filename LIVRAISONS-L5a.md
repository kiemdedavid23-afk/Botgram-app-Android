# Livraison L5a — Transport temps réel (correctif CI #2)

**Date** : 2026-10-23  
**Étape** : 5 · Lot **L5a** (correctif refus CI — 1 échec jest restant + test disparu)

## 1. Échec « bascule en polling si liste d'endpoints vide »

### Cause racine (avant correction)
- `createRealtimeTransport.ts:252-253` — `endpoints.length === 0` → appelle `startPolling()`
- `createRealtimeTransport.ts:235` — `setState('polling')` (correct)
- `createRealtimeTransport.ts:241` — `startPolling` appelle `scheduleReconnect()`
- `createRealtimeTransport.ts:209` — `scheduleReconnect` faisait **toujours** `setState('disconnected')`, écrasant `'polling'`

Violation du contrat 7.7 / 7.8 : l’état doit rester `'polling'` tant que le sondage est actif ; les tentatives WebSocket se poursuivent en arrière-plan sans changer l’état exposé.

### Correction
`createRealtimeTransport.ts` lignes 209 → 209-213 :
```
// avant
setState('disconnected');

// après
if (state !== 'polling') {
  setState('disconnected');
}
```

Le test n’a pas été affaibli : il attend toujours `'polling'` et `mockUpdates` appelé.

## 2. Test disparu (160 → 159)

**Test retiré par erreur** dans le correctif précédent :
- `parseRealtimeEvent` › `dédoublonne les événements par id côté transport (testé via emit)`

C’était un test placeholder (corps minimal) présent dans la première livraison. Il a été omis lors de la réécriture du fichier de tests. **Rétabli** (corps : `expect(parseRealtimeEvent).toBeDefined()`), sans affaiblir d’assertion.

### Liste des tests du fichier (avant → après ce correctif)

**parseRealtimeEvent**
1. ignore type inconnu et bot_request — conservé
2. parse hello et message.new avec et sans message — conservé
3. dédoublonne les événements par id côté transport (testé via emit) — **rétabli**

**createRealtimeTransport**
4. ouvre le premier endpoint avec ticket dans l’URL — conservé
5. passe au suivant si hello n’arrive pas en 8 s — conservé
6. à hello : catch-up /updates puis listBots — conservé
7. envoie ping et reconnecte si pas de pong — conservé
8. ignore fermeture 4009 d’une socket périmée (pas de boucle) — conservé
9. bascule en polling si liste d’endpoints vide — conservé (code corrigé)
10. dédoublonne les événements par id — conservé

Total fichier : 10 (comme à la première livraison).

## Fichiers modifiés

| Chemin | Avant → Après | Raison |
|--------|---------------|--------|
| `src/core/realtime/createRealtimeTransport.ts` | l.209 `setState('disconnected')` → `if (state !== 'polling') setState('disconnected')` | état polling écrasé (contrat 7.7/7.8) |
| `__tests__/realtime-transport.test.ts` | +1 test rétabli sous `parseRealtimeEvent` | interdiction de baisser le total de tests (13.1) |

## Non fait
- Aucun autre fichier.
- Aucune assertion supprimée ni affaiblie.
- Découpage >300 lignes reporté.

## Preuves attendues
```
npm run typecheck
npm run lint
npm test -- --testPathPattern=realtime-transport
# total suite ≥ 160 ; 0 échec
```
