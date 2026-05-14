type AdminGetPermissionPresetResultProps = {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly permissionCodes: string[];
  readonly createdAt: Date;
};

export class AdminGetPermissionPresetResult {
  private constructor(private readonly result: AdminGetPermissionPresetResultProps) {}

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

  get permissionCodes(): string[] {
    return this.result.permissionCodes;
  }

  get createdAt(): Date {
    return this.result.createdAt;
  }

  static of(result: AdminGetPermissionPresetResultProps): AdminGetPermissionPresetResult {
    return new AdminGetPermissionPresetResult(result);
  }
}
