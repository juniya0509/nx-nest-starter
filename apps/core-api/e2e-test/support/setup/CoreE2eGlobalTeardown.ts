import { clearCoreE2eMySqlContainer, getCoreE2eMySqlContainer } from './CoreE2eContainerHolder';

export default async function coreE2eGlobalTeardown(): Promise<void> {
  const container = getCoreE2eMySqlContainer();
  if (container) {
    await container.stop();
    clearCoreE2eMySqlContainer();
  }
}
