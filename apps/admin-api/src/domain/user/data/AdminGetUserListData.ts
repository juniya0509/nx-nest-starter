import { UserStatusUnion } from '@libs/core-enum/src/UserStatus.enum';

type AdminGetUserListDataProps = {
  readonly page: number;
  readonly limit: number;
  readonly keyword: string;
  readonly status: UserStatusUnion | null;
};

export class AdminGetUserListData {
  private constructor(private readonly data: AdminGetUserListDataProps) {}

  get page(): number {
    return this.data.page;
  }

  get limit(): number {
    return this.data.limit;
  }

  get keyword(): string {
    return this.data.keyword;
  }

  get status(): UserStatusUnion | null {
    return this.data.status;
  }

  static of(data: AdminGetUserListDataProps): AdminGetUserListData {
    return new AdminGetUserListData(data);
  }
}
