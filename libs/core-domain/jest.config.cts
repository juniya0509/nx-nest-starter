const { readFileSync } = require('fs');
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = JSON.parse(readFileSync(`${__dirname}/../../tsconfig.base.json`, 'utf-8'));

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'),
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'core-domain',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../' }),
  coverageDirectory: 'test-output/jest/coverage',
  verbose: true,
};
