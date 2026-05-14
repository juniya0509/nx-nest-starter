type AdminUpdatePermissionPresetDataProps = {
  readonly name: string;
  readonly description: string | null;
  readonly permissionCodes: string[];
};

export class AdminUpdatePermissionPresetData {
  private constructor(private readonly data: AdminUpdatePermissionPresetDataProps) {}

  get name(): string {
    return this.data.name;
  }

  get description(): string | null {
    return this.data.description;
  }

  get permissionCodes(): string[] {
    return this.data.permissionCodes;
  }

  static fromReqDto(data: AdminUpdatePermissionPresetDataProps): AdminUpdatePermissionPresetData {
    return new AdminUpdatePermissionPresetData(data);
  }
}
