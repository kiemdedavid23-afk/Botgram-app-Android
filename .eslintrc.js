module.exports = {
  root: true,
  extends: '@react-native',
  parserOptions: {
    requireConfigFile: false,
  },
  rules: {
    'no-console': ['warn', {allow: ['warn', 'error']}],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {minimumDescriptionLength: 10},
    ],
  },
};
