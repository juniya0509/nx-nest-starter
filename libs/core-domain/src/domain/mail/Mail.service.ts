import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GetUserResult } from '../user/result/GetUserResult';

import { MailResolver } from './Mail.resolver';
import { MailSender } from './Mail.sender';
import { WelcomeMailTemplate } from './template/Welcome.template';

/**
 * core-api 흐름에서 자동 발송되는 메일 (예: 회원가입 환영) 전용 service.
 * 관리자가 직접 호출하는 bulk/template 발송은 admin-api 의 AdminMailService 가 담당한다.
 */
@Injectable()
export class MailService {
  constructor(
    private readonly mailSender: MailSender,
    private readonly mailResolver: MailResolver,
    private readonly configService: ConfigService,
  ) {}

  /** 회원가입 완료 자동 안내메일. 호출 측에서 try/catch (실패가 가입 흐름을 막지 않도록). */
  async sendWelcome(user: GetUserResult): Promise<void> {
    const vars = {
      recipientName: this.mailResolver.resolve(user),
      companyName: this.configService.get<string>('MAIL_COMPANY_NAME')!,
      productName: this.configService.get<string>('MAIL_PRODUCT_NAME')!,
    };
    const lang = user.defaultLanguage;

    await this.mailSender.sendOne({
      to: user.email,
      subject: WelcomeMailTemplate.buildSubject(vars, lang),
      html: WelcomeMailTemplate.buildHtml(vars, lang),
      text: WelcomeMailTemplate.buildText(vars, lang),
    });
  }
}
