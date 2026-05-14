import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

type AdminSendBulkRawDataProps = {
  readonly recipients: ReadonlyArray<string>;
  readonly subject: string;
  readonly html: string;
  readonly lang: LanguageCodeUnion;
};

export class AdminSendBulkRawData {
  private constructor(private readonly data: AdminSendBulkRawDataProps) {}

  get recipients(): ReadonlyArray<string> {
    return this.data.recipients;
  }

  get subject(): string {
    return this.data.subject;
  }

  get html(): string {
    return this.data.html;
  }

  get lang(): LanguageCodeUnion {
    return this.data.lang;
  }

  static of(data: AdminSendBulkRawDataProps): AdminSendBulkRawData {
    return new AdminSendBulkRawData({ ...data, recipients: [...data.recipients] });
  }
}
