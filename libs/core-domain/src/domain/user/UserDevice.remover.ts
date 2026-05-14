import { Injectable } from '@nestjs/common';

import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';

@Injectable()
export class UserDeviceRemover {
  constructor(private readonly userDeviceRepository: UserDeviceRepository) {}

  async removeByPushToken(pushToken: string): Promise<void> {
    await this.userDeviceRepository.removeByPushToken(pushToken);
  }
}
