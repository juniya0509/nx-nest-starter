import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '@libs/core-database/src/mysql/entity/user/User.repository';

import { CoreDomainError } from '../../support/error/CoreDomainError';

import { GetUserResult } from './result/GetUserResult';

@Injectable()
export class UserReader {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(userId: number): Promise<GetUserResult | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    return GetUserResult.of({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      avatarUrl: user.avatarUrl,
      status: user.status,
      defaultLanguage: user.defaultLanguage,
      createdAt: user.createdAt,
    });
  }

  async findByEmail(email: string): Promise<GetUserResult | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    return GetUserResult.of({
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      avatarUrl: user.avatarUrl,
      status: user.status,
      defaultLanguage: user.defaultLanguage,
      createdAt: user.createdAt,
    });
  }

  async findByEmails(emails: ReadonlyArray<string>): Promise<GetUserResult[]> {
    if (emails.length === 0) return [];
    const users = await this.userRepository.findByEmails(emails);
    return users.map((user) =>
      GetUserResult.of({
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        avatarUrl: user.avatarUrl,
        status: user.status,
        defaultLanguage: user.defaultLanguage,
        createdAt: user.createdAt,
      }),
    );
  }

  async findByIdList(ids: ReadonlyArray<number>): Promise<GetUserResult[]> {
    if (ids.length === 0) return [];
    const users = await this.userRepository.findByIdList(ids);
    return users.map((user) =>
      GetUserResult.of({
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        avatarUrl: user.avatarUrl,
        status: user.status,
        defaultLanguage: user.defaultLanguage,
        createdAt: user.createdAt,
      }),
    );
  }

  async getByIdOrThrow(userId: number): Promise<GetUserResult> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException({ errorType: CoreDomainError.USER_NOT_FOUND });
    }
    return user;
  }

  async verifyEmailNotTaken(email: string): Promise<void> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException({ errorType: CoreDomainError.DUPLICATE_EMAIL });
    }
  }
}
