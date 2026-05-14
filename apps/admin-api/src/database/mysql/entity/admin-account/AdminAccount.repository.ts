import { Brackets, Repository } from 'typeorm';

import { CustomRepository } from '@libs/core-database/src/mysql/decorator/TypeOrmCustomRepository.decorator';
import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';

import { AdminAccountStatusUnion } from '../../../../enum/AdminAccountStatus.enum';

import { AdminAccountEntity } from './AdminAccount.entity';

@CustomRepository(AdminAccountEntity)
export class AdminAccountRepository extends Repository<AdminAccountEntity> {
  async findById(id: number): Promise<AdminAccountEntity | null> {
    const adminAccount = await this.findOne({ where: { id }, relations: { user: true } });
    if (!adminAccount?.user) return null;

    return adminAccount;
  }

  async findByUserId(userId: number): Promise<AdminAccountEntity | null> {
    const adminAccount = await this.findOne({ where: { user: { id: userId } }, relations: { user: true } });
    if (!adminAccount?.user) return null;

    return adminAccount;
  }

  async findListWithPagination(params: {
    readonly page: number;
    readonly limit: number;
    readonly keyword: string;
    readonly status: AdminAccountStatusUnion | null;
  }): Promise<{ readonly items: AdminAccountEntity[]; readonly user: UserEntity[]; readonly totalResults: number }> {
    const { page, limit, keyword, status } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.createQueryBuilder('adminAccount')
      .innerJoinAndSelect('adminAccount.user', 'user')
      .orderBy('adminAccount.id', 'DESC')
      .skip(skip)
      .take(limit);

    if (status !== null) {
      queryBuilder.andWhere('adminAccount.status = :status', { status });
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
    const user = items.map((adminAccount) => adminAccount.user);

    return { items, user, totalResults };
  }

  async createAdminAccount(data: { readonly userId: number; readonly memo: string | null }): Promise<AdminAccountEntity> {
    const created = await this.save(
      this.create({
        user: { id: data.userId },
        memo: data.memo,
        status: 'ACTIVE',
      }),
    );

    return created;
  }

  async softDeleteById(id: number): Promise<void> {
    await this.softDelete({ id });
  }
}
