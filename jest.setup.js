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

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(() => Promise.resolve([])),
  types: {allFiles: 'public.item', images: 'public.image'},
  isErrorWithCode: () => false,
  errorCodes: {OPERATION_CANCELED: 'OPERATION_CANCELED'},
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
    getString: jest.fn(() => Promise.resolve('')),
  },
}));

// lucide-react-native est publié en ESM (.mjs) : Jest ne le transforme pas.
// Les icônes sont purement visuelles, on les remplace par des composants vides.
jest.mock('lucide-react-native', () => {
  const cache = {};
  return new Proxy(
    {__esModule: true},
    {
      get: (target, key) => {
        if (key === '__esModule') {
          return true;
        }
        if (typeof key !== 'string') {
          return undefined;
        }
        if (!cache[key]) {
          cache[key] = () => null;
        }
        return cache[key];
      },
    },
  );
});
