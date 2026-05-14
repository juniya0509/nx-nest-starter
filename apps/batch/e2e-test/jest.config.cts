const { readFileSync } = require('fs');
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = JSON.parse(readFileSync(`${__dirname}/../../../tsconfig.base.json`, 'utf-8'));

const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/../.spec.swcrc`, 'utf-8'));
swcJestConfig.swcrc = false;

/**
 * batch 앱의 e2e 는 starter 시점엔 placeholder.
 * cron 작업 자체는 단위 테스트 (`*.batch.spec.ts`) 로 충분히 검증 가능 (cron handler 메서드 직접 호출).
 * DB 통합 검증이 필요해지면 core-api 처럼 testcontainers + globalSetup/Teardown 추가.
 */
module.exports = {
  displayName: 'batch-e2e',
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../../' }),
  testTimeout: 60000,
  maxWorkers: 1,
  verbose: true,
};
