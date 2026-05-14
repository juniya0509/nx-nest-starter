import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

import { DataSource, NamingStrategyInterface } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { UserEntity } from '../entity/user/User.entity';
import { UserDeviceEntity } from '../entity/user/UserDevice.entity';
import { UserOauthEntity } from '../entity/user/UserOauth.entity';
import { UserTokenEntity } from '../entity/user/UserToken.entity';

import { TypeOrmLoggerConfig } from './TypeOrmLogger.config';

const MAX_QUERY_EXECUTION_TIME_MS = 3000;
const CONNECT_TIMEOUT_MS = 10000;
const CONNECTION_LIMIT_COUNT = 30;
const KEEP_ALIVE_INITIAL_DELAY_MS = 10000;

const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory(configService: ConfigService) {
    const NODE_ENV = configService.get<string>('NODE_ENV');
    const isUseSynchronize = NODE_ENV !== 'production';

    return {
      type: 'mysql',
      host: configService.get<string>('MYSQL_DB_HOST'),
      port: configService.get<number>('MYSQL_DB_PORT'),
      username: configService.get<string>('MYSQL_DB_USERNAME'),
      password: configService.get<string>('MYSQL_DB_PASSWORD'),
      database: configService.get<string>('MYSQL_DB_NAME'),
      synchronize: isUseSynchronize,
      bigNumberStrings: false,
      logger: new TypeOrmLoggerConfig(true),
      charset: 'utf8mb4',
      namingStrategy: new SnakeNamingStrategy() as unknown as NamingStrategyInterface,
      maxQueryExecutionTime: MAX_QUERY_EXECUTION_TIME_MS,
      connectTimeout: CONNECT_TIMEOUT_MS,
      extra: {
        connectionLimit: CONNECTION_LIMIT_COUNT,
        waitForConnections: true,
        enableKeepAlive: true,
        keepAliveInitialDelay: KEEP_ALIVE_INITIAL_DELAY_MS,
      },
      entities: [UserEntity, UserOauthEntity, UserTokenEntity, UserDeviceEntity],
    };
  },
  async dataSourceFactory(options) {
    if (!options) {
      throw new Error('Invalid options passed');
    }

    return addTransactionalDataSource(new DataSource(options));
  },
};

export default typeOrmConfig;
