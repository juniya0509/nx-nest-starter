import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { TYPEORM_CUSTOM_REPOSITORY } from '../decorator/TypeOrmCustomRepository.decorator';

@Module({})
export class TypeOrmCustomRepositoryModule {
  public static forCustomRepository<T extends Type<unknown>>(repositories: T[]): DynamicModule {
    const providers: Provider[] = [];

    for (const repository of repositories) {
      const entity = Reflect.getMetadata(TYPEORM_CUSTOM_REPOSITORY, repository);

      if (!entity) {
        continue;
      }

      providers.push({
        inject: [getDataSourceToken()],
        provide: repository,
        useFactory: (dataSource: DataSource) => {
          const baseRepository = dataSource.getRepository(entity);

          return new repository(baseRepository.target, baseRepository.manager, baseRepository.queryRunner);
        },
      });
    }

    return {
      exports: providers,
      module: TypeOrmCustomRepositoryModule,
      providers,
    };
  }
}
