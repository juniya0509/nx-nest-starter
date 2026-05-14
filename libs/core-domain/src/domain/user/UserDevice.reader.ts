import { Injectable } from '@nestjs/common';

import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';

import { GetUserDeviceResult } from './result/GetUserDeviceResult';

@Injectable()
export class UserDeviceReader {
  constructor(private readonly userDeviceRepository: UserDeviceRepository) {}

  async findByUserId(userId: number): Promise<GetUserDeviceResult[]> {
    const devices = await this.userDeviceRepository.findByUserId(userId);
    return devices.map((d) =>
      GetUserDeviceResult.of({
        id: d.id,
        userId: d.user.id,
        deviceType: d.deviceType,
        pushToken: d.pushToken,
        language: d.language,
      }),
    );
  }

  async findByUserIds(userIds: ReadonlyArray<number>): Promise<GetUserDeviceResult[]> {
    if (userIds.length === 0) return [];
    const all = await Promise.all(userIds.map((id) => this.userDeviceRepository.findByUserId(id)));
    return all.flat().map((d) =>
      GetUserDeviceResult.of({
        id: d.id,
        userId: d.user.id,
        deviceType: d.deviceType,
        pushToken: d.pushToken,
        language: d.language,
      }),
    );
  }
}
