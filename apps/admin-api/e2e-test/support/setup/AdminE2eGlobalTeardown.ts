import { clearAdminE2eMySqlContainer, getAdminE2eMySqlContainer } from './AdminE2eContainerHolder';

export default async function adminE2eGlobalTeardown(): Promise<void> {
  const container = getAdminE2eMySqlContainer();
  if (container) {
    await container.stop();
    clearAdminE2eMySqlContainer();
  }
}
