import { MySqlContainer } from '@testcontainers/mysql';

import { setAdminE2eMySqlContainer } from './AdminE2eContainerHolder';
import { setAdminTestEnv } from './AdminTestEnv';

export default async function adminE2eGlobalSetup(): Promise<void> {
  setAdminTestEnv();

  const container = await new MySqlContainer('mysql:8.0').start();

  process.env.MYSQL_DB_HOST = container.getHost();
  process.env.MYSQL_DB_PORT = String(container.getPort());
  process.env.MYSQL_DB_USERNAME = container.getUsername();
  process.env.MYSQL_DB_PASSWORD = container.getUserPassword();
  process.env.MYSQL_DB_NAME = container.getDatabase();

  setAdminE2eMySqlContainer(container);
}
