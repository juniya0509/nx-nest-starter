type SendMailResultProps = {
  readonly success: ReadonlyArray<string>;
  readonly failed: ReadonlyArray<{ email: string; reason: string }>;
};

export class SendMailResult {
  private constructor(private readonly data: SendMailResultProps) {}

  get success(): ReadonlyArray<string> {
    return this.data.success;
  }

  get failed(): ReadonlyArray<{ email: string; reason: string }> {
    return this.data.failed;
  }

  get successCount(): number {
    return this.data.success.length;
  }

  get failedCount(): number {
    return this.data.failed.length;
  }

  static of(data: SendMailResultProps): SendMailResult {
    return new SendMailResult({
      success: [...data.success],
      failed: data.failed.map((f) => ({ ...f })),
    });
  }
}
