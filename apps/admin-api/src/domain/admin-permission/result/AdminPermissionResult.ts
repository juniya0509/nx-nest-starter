type AdminPermissionResultProps = {
  readonly id: number;
  readonly code: string;
  readonly groupCode: string;
  readonly description: string;
};

export class AdminPermissionResult {
  private constructor(private readonly result: AdminPermissionResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get code(): string {
    return this.result.code;
  }

  get groupCode(): string {
    return this.result.groupCode;
  }

  get description(): string {
    return this.result.description;
  }

  static of(result: AdminPermissionResultProps): AdminPermissionResult {
    return new AdminPermissionResult(result);
  }
}
