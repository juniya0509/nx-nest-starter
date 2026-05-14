import { ApiProperty } from '@nestjs/swagger';

import { SendPushResult } from '@libs/core-domain/src/domain/push/result/SendPushResult';

class PushFailureReasonItem {
  @ApiProperty({ type: 'string', description: 'FCM 호출 실패 사유 (예: messaging/registration-token-not-registered)' })
  readonly reason!: string;

  @ApiProperty({ type: 'integer', description: '해당 사유로 실패한 device 수' })
  readonly count!: number;
}

export class AdminSendPushRes {
  @ApiProperty({ type: 'integer', description: '발송 성공 device 수 (user 수가 아님)' })
  readonly successCount!: number;

  @ApiProperty({ type: 'integer', description: '발송 실패 device 수' })
  readonly failedCount!: number;

  @ApiProperty({
    type: [PushFailureReasonItem],
    description: '실패 사유별 device 수 grouping. push token 은 device 식별자라 응답에 노출하지 않고 reason 통계만 반환.',
  })
  readonly failureReasons!: PushFailureReasonItem[];

  static of(result: SendPushResult): AdminSendPushRes {
    const counts = new Map<string, number>();
    for (const f of result.failed) {
      counts.set(f.reason, (counts.get(f.reason) ?? 0) + 1);
    }
    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      failureReasons: [...counts.entries()].map(([reason, count]) => ({ reason, count })),
    };
  }
}
