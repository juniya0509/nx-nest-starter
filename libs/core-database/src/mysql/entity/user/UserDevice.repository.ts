import { Repository } from 'typeorm';

import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserDeviceTypeUnion } from '@libs/core-enum/src/UserDeviceType.enum';

import { CustomRepository } from '../../decorator/TypeOrmCustomRepository.decorator';

import { UserDeviceEntity } from './UserDevice.entity';

@CustomRepository(UserDeviceEntity)
export class UserDeviceRepository extends Repository<UserDeviceEntity> {
  async findByPushToken(pushToken: string): Promise<UserDeviceEntity | null> {
    return this.findOne({ where: { pushToken } });
  }

  async findByUserId(userId: number): Promise<UserDeviceEntity[]> {
    return this.find({ where: { user: { id: userId } }, relations: { user: true } });
  }

  async createDevice(data: {
    readonly userId: number;
    readonly deviceType: UserDeviceTypeUnion;
    readonly pushToken: string;
    readonly language: LanguageCodeUnion;
  }): Promise<UserDeviceEntity> {
    const { userId, deviceType, pushToken, language } = data;
    return this.save(this.create({ user: { id: userId }, deviceType, pushToken, language }));
  }

  async removeByPushToken(pushToken: string): Promise<void> {
    await this.delete({ pushToken });
  }

  async removeByUserId(userId: number): Promise<void> {
    await this.delete({ user: { id: userId } });
  }
}
