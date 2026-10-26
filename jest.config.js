module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '\\.d\\.ts$'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@react-native-community|lucide-react-native)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^react-native-blob-util$': '<rootDir>/__mocks__/react-native-blob-util.ts',
    '^@op-engineering/op-sqlite$': '<rootDir>/__mocks__/op-sqlite.ts',
  },
};