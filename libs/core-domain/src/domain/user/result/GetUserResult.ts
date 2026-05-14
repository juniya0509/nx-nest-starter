import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';
import { UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

type GetUserResultProps = {
  readonly id: number;
  readonly email: string;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly avatarUrl: string | null;
  readonly status: UserStatusUnion;
  readonly defaultLanguage: LanguageCodeUnion;
  readonly createdAt: Date;
};

export class GetUserResult {
  private constructor(private readonly result: GetUserResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get email(): string {
    return this.result.email;
  }

  get firstname(): string | null {
    return this.result.firstname;
  }

  get lastname(): string | null {
    return this.result.lastname;
  }

  get avatarUrl(): string | null {
    return this.result.avatarUrl;
  }

  get status(): UserStatusUnion {
    return this.result.status;
  }

  get defaultLanguage(): LanguageCodeUnion {
    return this.result.defaultLanguage;
  }

  get createdAt(): Date {
    return this.result.createdAt;
  }

  get fullname(): string {
    return [this.result.firstname, this.result.lastname].filter((part): part is string => part !== null && part.length > 0).join(' ');
  }

  static of(result: GetUserResultProps): GetUserResult {
    return new GetUserResult(result);
  }
}
