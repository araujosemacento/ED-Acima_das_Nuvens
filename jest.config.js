module.exports = {
  runner: 'jest-pytest',
  testMatch: ['**/tests/*.test.py', '**/tests/*_test.py'],
  moduleFileExtensions: ['py'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    '*.py',
    '!venv/**',
    '!.venv/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};