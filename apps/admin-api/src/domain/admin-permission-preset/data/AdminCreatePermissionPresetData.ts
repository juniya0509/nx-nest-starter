type AdminCreatePermissionPresetDataProps = {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly permissionCodes: string[];
};

export class AdminCreatePermissionPresetData {
  private constructor(private readonly data: AdminCreatePermissionPresetDataProps) {}

  get code(): string {
    return this.data.code;
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string | null {
    return this.data.description;
  }

  get permissionCodes(): string[] {
    return this.data.permissionCodes;
  }

  static fromReqDto(data: AdminCreatePermissionPresetDataProps): AdminCreatePermissionPresetData {
    return new AdminCreatePermissionPresetData(data);
  }
}
