import { MySqlContainer } from '@testcontainers/mysql';

import { setCoreE2eMySqlContainer } from './CoreE2eContainerHolder';
import { setCoreTestEnv } from './CoreTestEnv';

export default async function coreE2eGlobalSetup(): Promise<void> {
  setCoreTestEnv();

  const container = await new MySqlContainer('mysql:8.0').start();

  process.env.MYSQL_DB_HOST = container.getHost();
  process.env.MYSQL_DB_PORT = String(container.getPort());
  process.env.MYSQL_DB_USERNAME = container.getUsername();
  process.env.MYSQL_DB_PASSWORD = container.getUserPassword();
  process.env.MYSQL_DB_NAME = container.getDatabase();

  setCoreE2eMySqlContainer(container);
}
