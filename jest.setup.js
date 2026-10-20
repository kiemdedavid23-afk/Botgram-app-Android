/* eslint-env jest */
/**
 * Setup Jest : mocks des modules natifs.
 */
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://api.exemple.invalid/v1',
  APP_PLATFORM: 'android',
  APP_CHANNEL: 'direct',
  APP_BUILD: '1',
  APP_VERSION: '1.0.0',
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when'},
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({isConnected: true})),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-get-random-values', () => {});
