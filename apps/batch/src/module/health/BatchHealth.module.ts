import { Module } from '@nestjs/common';

import { BatchHealthController } from './BatchHealth.controller';

@Module({
  controllers: [BatchHealthController],
})
export class BatchHealthModule {}
