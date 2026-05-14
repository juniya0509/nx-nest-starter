type SendPushResultProps = {
  readonly success: ReadonlyArray<string>;
  readonly failed: ReadonlyArray<{ pushToken: string; reason: string }>;
};

export class SendPushResult {
  private constructor(private readonly data: SendPushResultProps) {}

  get success(): ReadonlyArray<string> {
    return this.data.success;
  }

  get failed(): ReadonlyArray<{ pushToken: string; reason: string }> {
    return this.data.failed;
  }

  get successCount(): number {
    return this.data.success.length;
  }

  get failedCount(): number {
    return this.data.failed.length;
  }

  static empty(): SendPushResult {
    return new SendPushResult({ success: [], failed: [] });
  }

  static of(data: SendPushResultProps): SendPushResult {
    return new SendPushResult({
      success: [...data.success],
      failed: data.failed.map((f) => ({ ...f })),
    });
  }
}
