/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};

module.exports = config;
