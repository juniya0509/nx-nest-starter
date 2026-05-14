import { Module } from '@nestjs/common';

import { HealthController } from '../../controller/health/v1/Health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
