import { Injectable } from '@nestjs/common';

import { AdminPermissionReader } from './AdminPermission.reader';
import { AdminPermissionResult } from './result/AdminPermissionResult';

@Injectable()
export class AdminPermissionService {
  constructor(private readonly adminPermissionReader: AdminPermissionReader) {}

  async getCatalog(): Promise<AdminPermissionResult[]> {
    return this.adminPermissionReader.findAllFromCatalog();
  }
}
