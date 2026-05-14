import { BadRequestException, Injectable } from '@nestjs/common';

import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

const MAX_BULK_RECIPIENTS = 100;

/**
 * 관리자 bulk 메일 수신자 사전 검증 implement.
 * - 개수 (1..MAX) 검증
 * - 모든 수신자가 user 테이블에 등록되어 있는지 검증 (미등록이면 전체 거부)
 */
@Injectable()
export class AdminMailValidator {
  constructor(private readonly userReader: UserReader) {}

  assertValidCount(recipients: ReadonlyArray<string>): void {
    if (recipients.length === 0 || recipients.length > MAX_BULK_RECIPIENTS) {
      throw new BadRequestException({
        errorType: CoreDomainError.INVALID_MAIL_RECIPIENT,
        errorData: { reason: `recipients must be 1..${MAX_BULK_RECIPIENTS}`, given: recipients.length },
      });
    }
  }

  /** 미등록 이메일이 한 명이라도 있으면 전체 발송을 거부 (admin 의 의도 확인 강제). */
  async assertAllRegistered(recipients: ReadonlyArray<string>): Promise<void> {
    const registered = await this.userReader.findByEmails(recipients);
    const registeredSet = new Set(registered.map((u) => u.email));
    const unregistered = recipients.filter((email) => !registeredSet.has(email));
    if (unregistered.length > 0) {
      throw new BadRequestException({
        errorType: CoreDomainError.INVALID_MAIL_RECIPIENT,
        errorData: { reason: 'recipients contain unregistered email(s)', unregistered },
      });
    }
  }
}
