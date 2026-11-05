import {
  parsePushData,
  updatesTopic,
} from '../src/core/push/pushPayload';

describe('parsePushData', () => {
  it('message : conversation et bot', () => {
    expect(
      parsePushData({type: 'message', bot_id: 'b1', conversation_id: 'c1'}),
    ).toEqual({kind: 'message', botId: 'b1', conversationId: 'c1'});
  });

  it('mise à jour de l’application', () => {
    expect(parsePushData({type: 'app_update'}).kind).toBe('app_update');
  });

  it('données absentes ou invalides : other, sans identifiants', () => {
    for (const d of [undefined, null, 'x', 42, {}, {conversation_id: 5}]) {
      expect(parsePushData(d)).toEqual({
        kind: 'other',
        botId: null,
        conversationId: null,
      });
    }
  });

  it('topic selon le canal', () => {
    expect(updatesTopic('direct')).toBe('app-update-android-direct');
  });
});
