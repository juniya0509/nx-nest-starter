import { Injectable } from '@nestjs/common';

import { UserEntity } from '@libs/core-database/src/mysql/entity/user/User.entity';
import { UserDeviceRepository } from '@libs/core-database/src/mysql/entity/user/UserDevice.repository';

import { UpsertUserDeviceData } from './data/UpsertUserDeviceData';

@Injectable()
export class UserDeviceCreator {
  constructor(private readonly userDeviceRepository: UserDeviceRepository) {}

  /**
   * pushToken 을 기준으로 upsert.
   * - 동일 pushToken row 가 이미 있으면 user / deviceType / language 를 모두 갱신 (기기 양도/리셋 시 이전 user 의 등록을 새 user 로 옮김)
   * - 없으면 신규 insert
   */
  async upsertByPushToken(data: UpsertUserDeviceData): Promise<void> {
    const existing = await this.userDeviceRepository.findByPushToken(data.pushToken);

    if (existing) {
      existing.user = { id: data.userId } as UserEntity;
      existing.deviceType = data.deviceType;
      existing.language = data.language;
      await this.userDeviceRepository.save(existing);
      return;
    }

    await this.userDeviceRepository.createDevice({
      userId: data.userId,
      deviceType: data.deviceType,
      pushToken: data.pushToken,
      language: data.language,
    });
  }
}
