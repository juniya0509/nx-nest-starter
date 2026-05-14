import { Enum, EnumConstNames, EnumType } from 'ts-jenum';

@Enum('code')
export class UserDeviceType extends EnumType<UserDeviceType>() {
  static readonly WEB_BROWSER = new UserDeviceType('WEB_BROWSER', '웹 브라우저');
  static readonly IOS_APP = new UserDeviceType('IOS_APP', 'iOS 앱');
  static readonly ANDROID_APP = new UserDeviceType('ANDROID_APP', 'Android 앱');

  private constructor(
    readonly _code: string,
    readonly _description: string,
  ) {
    super();
  }

  get code(): string {
    return this._code;
  }

  get description(): string {
    return this._description;
  }
}

export type UserDeviceTypeUnion = EnumConstNames<typeof UserDeviceType>;

export const userDeviceTypeList = UserDeviceType.keys();
