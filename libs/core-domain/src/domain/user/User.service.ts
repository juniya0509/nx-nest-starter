import { Injectable } from '@nestjs/common';

import { GetUserResult } from './result/GetUserResult';
import { UserReader } from './User.reader';

@Injectable()
export class UserService {
  constructor(private readonly userReader: UserReader) {}

  async getUserById(userId: number): Promise<GetUserResult> {
    return await this.userReader.getByIdOrThrow(userId);
  }
}
