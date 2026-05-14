import { BadRequestException, Injectable } from '@nestjs/common';

import { UserReader } from '@libs/core-domain/src/domain/user/User.reader';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

const MAX_BULK_RECIPIENTS = 100;

/**
 * 관리자 bulk push 수신자 (userId) 사전 검증.
 * - 개수 검증
 * - userIds 가 모두 user 테이블에 등록되어 있는지 (미등록 한 명이라도 있으면 거부)
 *
 * 주의: 등록은 되어 있지만 user_device 가 없는 사용자는 통과시킨다 (push 권한 거부 사용자도 발송 대상에 포함 가능).
 *       실제 device 가 없으면 단순히 해당 user 에게는 발송이 0건으로 누락된다.
 */
@Injectable()
export class AdminPushValidator {
  constructor(private readonly userReader: UserReader) {}

  assertValidCount(userIds: ReadonlyArray<number>): void {
    if (userIds.length === 0 || userIds.length > MAX_BULK_RECIPIENTS) {
      throw new BadRequestException({
        errorType: CoreDomainError.INVALID_MAIL_RECIPIENT,
        errorData: { reason: `userIds must be 1..${MAX_BULK_RECIPIENTS}`, given: userIds.length },
      });
    }
  }

  async assertAllRegistered(userIds: ReadonlyArray<number>): Promise<void> {
    const registered = await this.userReader.findByIdList(userIds);
    const registeredSet = new Set(registered.map((u) => u.id));
    const unregistered = userIds.filter((id) => !registeredSet.has(id));
    if (unregistered.length > 0) {
      throw new BadRequestException({
        errorType: CoreDomainError.INVALID_MAIL_RECIPIENT,
        errorData: { reason: 'userIds contain unregistered user(s)', unregistered },
      });
    }
  }
}
