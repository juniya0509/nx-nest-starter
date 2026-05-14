import type { StartedMySqlContainer } from '@testcontainers/mysql';

let container: StartedMySqlContainer | null = null;

export function setAdminE2eMySqlContainer(value: StartedMySqlContainer): void {
  container = value;
}

export function getAdminE2eMySqlContainer(): StartedMySqlContainer | null {
  return container;
}

export function clearAdminE2eMySqlContainer(): void {
  container = null;
}
