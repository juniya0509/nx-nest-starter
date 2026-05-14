import { ApiProperty } from '@nestjs/swagger';

import { SendMailResult } from '@libs/core-domain/src/domain/mail/result/SendMailResult';

class FailedRecipient {
  @ApiProperty({ type: 'string', format: 'email' })
  readonly email!: string;

  @ApiProperty({ type: 'string', description: 'SES 호출 실패 사유' })
  readonly reason!: string;
}

export class AdminSendMailRes {
  @ApiProperty({ type: 'integer', description: '발송 성공 건수' })
  readonly successCount!: number;

  @ApiProperty({ type: 'integer', description: '발송 실패 건수' })
  readonly failedCount!: number;

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'email' },
    description: '발송 성공한 수신자 이메일',
  })
  readonly success!: string[];

  @ApiProperty({ type: [FailedRecipient], description: '발송 실패한 수신자와 사유' })
  readonly failed!: FailedRecipient[];

  static of(result: SendMailResult): AdminSendMailRes {
    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      success: [...result.success],
      failed: result.failed.map((f) => ({ ...f })),
    };
  }
}
