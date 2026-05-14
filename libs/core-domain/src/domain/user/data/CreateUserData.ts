import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

type CreateUserDataProps = {
  readonly email: string;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly avatarUrl: string | null;
  readonly defaultLanguage: LanguageCodeUnion;
};

export class CreateUserData {
  private constructor(private readonly data: CreateUserDataProps) {}

  get email(): string {
    return this.data.email;
  }

  get firstname(): string | null {
    return this.data.firstname;
  }

  get lastname(): string | null {
    return this.data.lastname;
  }

  get avatarUrl(): string | null {
    return this.data.avatarUrl;
  }

  get defaultLanguage(): LanguageCodeUnion {
    return this.data.defaultLanguage;
  }

  static fromOauthUserInfo(data: CreateUserDataProps): CreateUserData {
    return new CreateUserData({ ...data });
  }
}
