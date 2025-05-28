module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-navigation|@react-navigation|anon-identity|@noble)/)',
  ],
  moduleNameMapper: {
    '^anon-identity$': '<rootDir>/src/__mocks__/anon-identity.ts',
    '^react-native-qrcode-scanner$': '<rootDir>/src/__mocks__/react-native-qrcode-scanner.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
};
