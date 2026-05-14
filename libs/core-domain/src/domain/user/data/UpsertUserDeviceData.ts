import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserDeviceTypeUnion } from '@libs/core-enum/src/UserDeviceType.enum';

type UpsertUserDeviceDataProps = {
  readonly userId: number;
  readonly deviceType: UserDeviceTypeUnion;
  readonly pushToken: string;
  readonly language: LanguageCodeUnion;
};

export class UpsertUserDeviceData {
  private constructor(private readonly data: UpsertUserDeviceDataProps) {}

  get userId(): number {
    return this.data.userId;
  }

  get deviceType(): UserDeviceTypeUnion {
    return this.data.deviceType;
  }

  get pushToken(): string {
    return this.data.pushToken;
  }

  get language(): LanguageCodeUnion {
    return this.data.language;
  }

  static of(data: UpsertUserDeviceDataProps): UpsertUserDeviceData {
    return new UpsertUserDeviceData({ ...data });
  }
}
