import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

import { AdminMailTemplateId } from '../template/AdminMailTemplateId';

type AdminSendBulkTemplateDataProps = {
  readonly recipients: ReadonlyArray<string>;
  readonly templateId: AdminMailTemplateId;
  readonly vars: Record<string, unknown>;
  readonly lang: LanguageCodeUnion;
};

export class AdminSendBulkTemplateData {
  private constructor(private readonly data: AdminSendBulkTemplateDataProps) {}

  get recipients(): ReadonlyArray<string> {
    return this.data.recipients;
  }

  get templateId(): AdminMailTemplateId {
    return this.data.templateId;
  }

  get vars(): Record<string, unknown> {
    return this.data.vars;
  }

  get lang(): LanguageCodeUnion {
    return this.data.lang;
  }

  static of(data: AdminSendBulkTemplateDataProps): AdminSendBulkTemplateData {
    return new AdminSendBulkTemplateData({ ...data, recipients: [...data.recipients] });
  }
}
