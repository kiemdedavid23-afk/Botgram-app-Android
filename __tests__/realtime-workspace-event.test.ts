import {parseRealtimeEvent, eventId} from '../src/core/realtime/events';

describe('événement workspace.changed', () => {
  it('lit l’espace et le motif', () => {
    const ev = parseRealtimeEvent({
      type: 'workspace.changed',
      id: 'e1',
      at: 5,
      workspace_id: 'c_1',
      reason: 'role_changed',
    });
    expect(ev).toEqual({
      type: 'workspace.changed',
      id: 'e1',
      at: 5,
      workspace_id: 'c_1',
      reason: 'role_changed',
    });
    expect(ev && eventId(ev)).toBe('e1');
  });

  it('accepté sans id (pas de dédoublonnage dans ce cas)', () => {
    const ev = parseRealtimeEvent({
      type: 'workspace.changed',
      workspace_id: 'c_1',
      reason: 'member_removed',
    });
    expect(ev).toMatchObject({type: 'workspace.changed', reason: 'member_removed'});
    expect(ev && eventId(ev)).toBeUndefined();
  });

  it('motif absent : « updated »', () => {
    expect(
      parseRealtimeEvent({type: 'workspace.changed', workspace_id: 'c_1'}),
    ).toMatchObject({reason: 'updated'});
  });

  it('sans workspace_id : ignoré', () => {
    expect(parseRealtimeEvent({type: 'workspace.changed', id: 'e1'})).toBeNull();
  });
});
