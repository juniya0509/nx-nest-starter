type AdminSendBulkPushRawDataProps = {
  readonly userIds: ReadonlyArray<number>;
  readonly title: string;
  readonly body: string;
  readonly dataPayload: Record<string, string> | null;
};

export class AdminSendBulkPushRawData {
  private constructor(private readonly data: AdminSendBulkPushRawDataProps) {}

  get userIds(): ReadonlyArray<number> {
    return this.data.userIds;
  }

  get title(): string {
    return this.data.title;
  }

  get body(): string {
    return this.data.body;
  }

  get dataPayload(): Record<string, string> | null {
    return this.data.dataPayload;
  }

  static of(data: AdminSendBulkPushRawDataProps): AdminSendBulkPushRawData {
    return new AdminSendBulkPushRawData({ ...data, userIds: [...data.userIds] });
  }
}
