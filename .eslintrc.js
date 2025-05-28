module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    'coverage/**',
    'node_modules/**',
  ],
  env: {
    jest: true,
  },
  overrides: [
    {
      files: ['jest.setup.js', '**/*.test.{js,ts,tsx}', '**/__tests__/**'],
      env: {
        jest: true,
      },
      globals: {
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
      },
    },
  ],
};
