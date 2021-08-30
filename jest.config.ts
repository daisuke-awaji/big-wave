module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.ts'],
};
