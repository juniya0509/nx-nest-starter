import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserDeviceTypeUnion } from '@libs/core-enum/src/UserDeviceType.enum';

type GetUserDeviceResultProps = {
  readonly id: number;
  readonly userId: number;
  readonly deviceType: UserDeviceTypeUnion;
  readonly pushToken: string;
  readonly language: LanguageCodeUnion;
};

export class GetUserDeviceResult {
  private constructor(private readonly result: GetUserDeviceResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get userId(): number {
    return this.result.userId;
  }

  get deviceType(): UserDeviceTypeUnion {
    return this.result.deviceType;
  }

  get pushToken(): string {
    return this.result.pushToken;
  }

  get language(): LanguageCodeUnion {
    return this.result.language;
  }

  static of(result: GetUserDeviceResultProps): GetUserDeviceResult {
    return new GetUserDeviceResult(result);
  }
}
