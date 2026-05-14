import { In, Repository } from 'typeorm';

import { CountryCallingCodeUnion } from '@libs/core-enum/src/Country.enum';
import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

import { CustomRepository } from '../../decorator/TypeOrmCustomRepository.decorator';

import { UserEntity } from './User.entity';

@CustomRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
  async findById(userId: number): Promise<UserEntity | null> {
    const user = await this.findOne({
      where: { id: userId },
    });

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.findOne({
      where: { email },
    });

    return user;
  }

  async findByEmails(emails: ReadonlyArray<string>): Promise<UserEntity[]> {
    if (emails.length === 0) return [];
    return this.find({ where: { email: In([...emails]) } });
  }

  async findByIdList(ids: ReadonlyArray<number>): Promise<UserEntity[]> {
    if (ids.length === 0) return [];
    return this.find({ where: { id: In([...ids]) } });
  }

  async findByFullPhoneNumber(countryCallingCode: CountryCallingCodeUnion, phoneNumber: string): Promise<UserEntity | null> {
    const user = await this.findOne({
      where: {
        countryCallingCode,
        phoneNumber,
      },
    });

    return user;
  }

  async createUser(createUserData: {
    readonly email: string;
    readonly firstname: string | null;
    readonly lastname: string | null;
    readonly avatarUrl: string | null;
    readonly status: UserStatusUnion;
    readonly defaultLanguage: LanguageCodeUnion;
  }): Promise<UserEntity> {
    const { email, firstname, lastname, avatarUrl, status, defaultLanguage } = createUserData;

    const createdUser = await this.save(
      this.create({
        email,
        firstname,
        lastname,
        avatarUrl,
        status,
        defaultLanguage,
      }),
    );

    return createdUser;
  }
}
