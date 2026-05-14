import { CountryCallingCodeUnion, CountryCodeUnion } from '@libs/core-enum/src/Country.enum';
import { UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

type AdminGetUserResultProps = {
  readonly id: number;
  readonly email: string;
  readonly firstname: string | null;
  readonly lastname: string | null;
  readonly avatarUrl: string | null;
  readonly status: UserStatusUnion;
  readonly countryCode: CountryCodeUnion | null;
  readonly countryCallingCode: CountryCallingCodeUnion | null;
  readonly phoneNumber: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isAdmin: boolean;
};

export class AdminGetUserResult {
  private constructor(private readonly result: AdminGetUserResultProps) {}

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

  get fullname(): string {
    return [this.result.firstname, this.result.lastname].filter((part): part is string => part !== null && part.length > 0).join(' ');
  }

  get avatarUrl(): string | null {
    return this.result.avatarUrl;
  }

  get status(): UserStatusUnion {
    return this.result.status;
  }

  get countryCode(): CountryCodeUnion | null {
    return this.result.countryCode;
  }

  get countryCallingCode(): CountryCallingCodeUnion | null {
    return this.result.countryCallingCode;
  }

  get phoneNumber(): string | null {
    return this.result.phoneNumber;
  }

  get createdAt(): Date {
    return this.result.createdAt;
  }

  get updatedAt(): Date {
    return this.result.updatedAt;
  }

  get isAdmin(): boolean {
    return this.result.isAdmin;
  }

  static of(result: AdminGetUserResultProps): AdminGetUserResult {
    return new AdminGetUserResult(result);
  }
}
