const { readFileSync } = require('fs');
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = JSON.parse(readFileSync(`${__dirname}/../../../tsconfig.base.json`, 'utf-8'));

const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/../.spec.swcrc`, 'utf-8'));
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'admin-api-e2e',
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../../' }),
  globalSetup: '<rootDir>/support/setup/AdminE2eGlobalSetup.ts',
  globalTeardown: '<rootDir>/support/setup/AdminE2eGlobalTeardown.ts',
  testTimeout: 60000,
  maxWorkers: 1,
  verbose: true,
};
