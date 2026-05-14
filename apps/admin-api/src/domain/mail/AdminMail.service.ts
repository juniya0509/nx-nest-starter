import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailSender } from '@libs/core-domain/src/domain/mail/Mail.sender';
import { MailStripper } from '@libs/core-domain/src/domain/mail/Mail.stripper';
import { SendMailResult } from '@libs/core-domain/src/domain/mail/result/SendMailResult';
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminMailValidator } from './AdminMail.validator';
import { AdminSendBulkRawData } from './data/AdminSendBulkRawData';
import { AdminSendBulkTemplateData } from './data/AdminSendBulkTemplateData';
import { AdminAnnouncementMailTemplate, AdminAnnouncementMailVars } from './template/AdminAnnouncement.template';

/**
 * 관리자 전용 메일 발송 service.
 * 검증 / HTML 변환 등의 detail 은 implement layer (validator, stripper) 에 위임.
 * core-domain 의 MailSender 를 재사용한다.
 */
@Injectable()
export class AdminMailService {
  constructor(
    private readonly mailSender: MailSender,
    private readonly validator: AdminMailValidator,
    private readonly stripper: MailStripper,
    private readonly configService: ConfigService,
  ) {}

  async sendBulkRaw(data: AdminSendBulkRawData): Promise<SendMailResult> {
    this.validator.assertValidCount(data.recipients);
    await this.validator.assertAllRegistered(data.recipients);

    return this.mailSender.sendBulk({
      toList: data.recipients,
      subject: data.subject,
      html: data.html,
      text: this.stripper.strip(data.html),
    });
  }

  async sendBulkByTemplate(data: AdminSendBulkTemplateData): Promise<SendMailResult> {
    this.validator.assertValidCount(data.recipients);
    await this.validator.assertAllRegistered(data.recipients);

    const companyName = this.configService.get<string>('MAIL_COMPANY_NAME')!;
    const productName = this.configService.get<string>('MAIL_PRODUCT_NAME')!;

    if (data.templateId === 'announcement') {
      const v = data.vars as Partial<AdminAnnouncementMailVars>;
      if (typeof v.subject !== 'string' || typeof v.bodyHtml !== 'string') {
        throw new BadRequestException({
          errorType: CoreDomainError.INVALID_MAIL_RECIPIENT,
          errorData: { reason: 'announcement template requires { subject, bodyHtml }' },
        });
      }
      const vars: AdminAnnouncementMailVars = { subject: v.subject, bodyHtml: v.bodyHtml, companyName, productName };

      return this.mailSender.sendBulk({
        toList: data.recipients,
        subject: AdminAnnouncementMailTemplate.buildSubject(vars, data.lang),
        html: AdminAnnouncementMailTemplate.buildHtml(vars, data.lang),
        text: AdminAnnouncementMailTemplate.buildText(vars, data.lang),
      });
    }

    // 신규 templateId 추가 시 위에 분기를 붙인다. exhaustive check.
    const _exhaustive: never = data.templateId;
    throw new BadRequestException({ errorType: CoreDomainError.INVALID_MAIL_RECIPIENT, errorData: { templateId: _exhaustive } });
  }
}
