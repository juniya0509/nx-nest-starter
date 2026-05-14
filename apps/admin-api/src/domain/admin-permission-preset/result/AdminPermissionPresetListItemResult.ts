type AdminPermissionPresetListItemResultProps = {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly permissionCount: number;
  readonly createdAt: Date;
};

export class AdminPermissionPresetListItemResult {
  private constructor(private readonly result: AdminPermissionPresetListItemResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get code(): string {
    return this.result.code;
  }

  get name(): string {
    return this.result.name;
  }

  get description(): string | null {
    return this.result.description;
  }

  get permissionCount(): number {
    return this.result.permissionCount;
  }

  get createdAt(): Date {
    return this.result.createdAt;
  }

  static of(result: AdminPermissionPresetListItemResultProps): AdminPermissionPresetListItemResult {
    return new AdminPermissionPresetListItemResult(result);
  }
}
