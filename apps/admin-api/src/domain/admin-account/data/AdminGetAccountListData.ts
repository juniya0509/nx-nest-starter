import { AdminAccountStatusUnion } from '../../../enum/AdminAccountStatus.enum';

type AdminGetAccountListDataProps = {
  readonly page: number;
  readonly limit: number;
  readonly keyword: string;
  readonly status: AdminAccountStatusUnion | null;
};

export class AdminGetAccountListData {
  private constructor(private readonly data: AdminGetAccountListDataProps) {}

  get page(): number {
    return this.data.page;
  }

  get limit(): number {
    return this.data.limit;
  }

  get keyword(): string {
    return this.data.keyword;
  }

  get status(): AdminAccountStatusUnion | null {
    return this.data.status;
  }

  static of(data: AdminGetAccountListDataProps): AdminGetAccountListData {
    return new AdminGetAccountListData(data);
  }
}
