/**
 * Partie 0 — branchement transport ↔ auth (R1, R2).
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {useRealtimeLifecycle} from '../src/app/useRealtimeLifecycle';
import {useAuthStore} from '../src/features/auth/store/authStore';

const mockStart = jest.fn();
const mockStop = jest.fn();
let subscribedHandler: ((ev: {type: string}) => void) | null = null;
const mockUnsub = jest.fn();
const mockSubscribe = jest.fn((h: (ev: {type: string}) => void) => {
  subscribedHandler = h;
  return mockUnsub;
});

jest.mock('../src/core/realtime', () => ({
  getRealtimeTransport: () => ({
    start: mockStart,
    stop: mockStop,
    subscribe: mockSubscribe,
    getConnectionState: () => 'idle',
  }),
}));

const mockApplySignedOut = jest.fn(() => Promise.resolve());

jest.mock('../src/features/auth/store/authStore', () => {
  const {create} = jest.requireActual('zustand') as typeof import('zustand');
  const store = create(() => ({
    state: 'booting' as
      | 'booting'
      | 'signedOut'
      | 'signedIn'
      | 'upgradeRequired'
      | 'accountDisabled',
    member: null,
    offline: false,
    endReason: null,
    upgradeLatest: null,
    email: null,
    pendingCode: null,
  }));
  return {
    useAuthStore: store,
    applySignedOut: (reason?: string | null) => mockApplySignedOut(reason),
  };
});

function Harness(): null {
  useRealtimeLifecycle();
  return null;
}

describe('useRealtimeLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscribedHandler = null;
    act(() => {
      useAuthStore.setState({
        state: 'booting',
        member: null,
        offline: false,
        endReason: null,
        upgradeLatest: null,
        email: null,
        pendingCode: null,
      });
    });
  });

  it('démarre le transport quand state === signedIn', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    expect(mockStart).toHaveBeenCalled();
  });

  it('arrête le transport pour signedOut', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(Harness));
    });
    expect(mockStart).toHaveBeenCalled();
    act(() => {
      useAuthStore.setState({state: 'signedOut'});
      tree!.update(React.createElement(Harness));
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('session.revoked appelle applySignedOut(revoked)', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    expect(mockSubscribe).toHaveBeenCalled();
    expect(subscribedHandler).not.toBeNull();
    act(() => {
      subscribedHandler?.({type: 'session.revoked'});
    });
    expect(mockApplySignedOut).toHaveBeenCalledWith('revoked');
  });
});
