import { Injectable } from '@nestjs/common';

import { GetUserResult } from '../user/result/GetUserResult';

/**
 * 메일 수신자 표시명 결정 implement.
 * fullname 우선 → 비어있으면 email local-part → 그것도 비어있으면 '고객'.
 */
@Injectable()
export class MailResolver {
  resolve(user: GetUserResult): string {
    const fullname = user.fullname.trim();
    if (fullname.length > 0) return fullname;
    const localPart = user.email.split('@')[0];
    return localPart && localPart.length > 0 ? localPart : '고객';
  }
}
