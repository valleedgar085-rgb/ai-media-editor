module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(react-dnd|dnd-core|react-dnd-html5-backend|@react-dnd)/)'
  ],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'jsx', 'json']
};
