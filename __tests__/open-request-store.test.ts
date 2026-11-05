import {useOpenRequestStore} from '../src/features/conversations/store/openRequestStore';

const conversation = {id: 'c1', bot_id: 'b1', title: 'Awa'};

describe('openRequestStore', () => {
  it('request puis consume : une seule fois', () => {
    useOpenRequestStore.getState().request({conversation});
    expect(useOpenRequestStore.getState().pending?.conversation.id).toBe('c1');
    expect(useOpenRequestStore.getState().consume()?.conversation.title).toBe(
      'Awa',
    );
    expect(useOpenRequestStore.getState().pending).toBeNull();
    expect(useOpenRequestStore.getState().consume()).toBeNull();
  });
});

describe('openRequestStore — fil par identifiant', () => {
  it('requestThread puis consumeThread : une seule fois', () => {
    useOpenRequestStore.getState().requestThread('c7');
    expect(useOpenRequestStore.getState().consumeThread()).toBe('c7');
    expect(useOpenRequestStore.getState().consumeThread()).toBeNull();
  });
});
