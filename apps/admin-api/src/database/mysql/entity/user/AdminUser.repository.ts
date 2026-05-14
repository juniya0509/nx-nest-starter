import { Brackets, Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';
import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';

import { UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

@CustomRepository(UserEntity)
export class AdminUserRepository extends Repository<UserEntity> {
  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.findOne({ where: { id } });

    return user;
  }

  async findListWithPagination(params: {
    readonly page: number;
    readonly limit: number;
    readonly keyword: string;
    readonly status: UserStatusUnion | null;
  }): Promise<{ readonly items: UserEntity[]; readonly totalResults: number }> {
    const { page, limit, keyword, status } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder('user').orderBy('user.id', 'DESC').skip(skip).take(limit);

    if (status !== null) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (keyword.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('user.firstname LIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('user.lastname LIKE :keyword', { keyword: `%${keyword}%` });
        }),
      );
    }

    const [items, totalResults] = await queryBuilder.getManyAndCount();

    return { items, totalResults };
  }
}
