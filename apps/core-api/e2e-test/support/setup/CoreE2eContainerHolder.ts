import type { StartedMySqlContainer } from '@testcontainers/mysql';

let container: StartedMySqlContainer | null = null;

export function setCoreE2eMySqlContainer(value: StartedMySqlContainer): void {
  container = value;
}

export function getCoreE2eMySqlContainer(): StartedMySqlContainer | null {
  return container;
}

export function clearCoreE2eMySqlContainer(): void {
  container = null;
}
