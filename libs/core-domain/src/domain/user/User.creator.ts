import { Injectable } from '@nestjs/common';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';

import { CreateUserData } from './data/CreateUserData';
import { GetUserOauthResult } from './result/GetUserOauthResult';
import { GetUserResult } from './result/GetUserResult';
import { UserReader } from './User.reader';

@Injectable()
export class UserCreator {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userReader: UserReader,
  ) {}

  async createUserFromOauth(data: CreateUserData): Promise<GetUserResult> {
    await this.userReader.verifyEmailNotTaken(data.email);

    const createdUser = await this.userRepository.createUser({
      email: data.email,
      firstname: data.firstname,
      lastname: data.lastname,
      avatarUrl: data.avatarUrl,
      status: 'ACTIVE',
      defaultLanguage: data.defaultLanguage,
    });

    return GetUserResult.of({
      id: createdUser.id,
      email: createdUser.email,
      firstname: createdUser.firstname,
      lastname: createdUser.lastname,
      avatarUrl: createdUser.avatarUrl,
      status: createdUser.status,
      defaultLanguage: createdUser.defaultLanguage,
      createdAt: createdUser.createdAt,
    });
  }

  async findOrCreateIfNoOauth(
    data: CreateUserData,
    existingUserOauth: GetUserOauthResult | null,
  ): Promise<{ userId: number | null; isNewUser: boolean }> {
    if (existingUserOauth) return { userId: null, isNewUser: false };

    const existingByEmail = await this.userReader.findByEmail(data.email);
    if (existingByEmail) return { userId: existingByEmail.id, isNewUser: false };

    const created = await this.createUserFromOauth(data);
    return { userId: created.id, isNewUser: true };
  }
}
