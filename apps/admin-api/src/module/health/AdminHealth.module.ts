import { Module } from '@nestjs/common';

import { AdminHealthController } from '../../controller/health/v1/AdminHealth.controller';

@Module({
  controllers: [AdminHealthController],
})
export class AdminHealthModule {}
