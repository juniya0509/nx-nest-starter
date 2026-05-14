import { MailTemplate } from '@libs/core-domain/src/domain/mail/template/MailTemplate';

import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

export type AdminAnnouncementMailVars = {
  /** 메일 제목 (제품명 prefix 가 자동으로 붙음) */
  subject: string;
  /** 사전 sanitize 된 HTML 본문. admin 측에서 입력 후 그대로 삽입된다. */
  bodyHtml: string;
  companyName: string;
  productName: string;
};

type AnnouncementChrome = {
  footer: string;
  copyright: string;
};

const CHROME_STRINGS: Record<LanguageCodeUnion, (v: AdminAnnouncementMailVars) => AnnouncementChrome> = {
  ko: (v) => ({
    footer: `본 메일은 발신 전용입니다. 문의는 ${v.companyName} 고객센터로 부탁드립니다.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  'en-US': (v) => ({
    footer: `This is a send-only mailbox. For inquiries, please contact ${v.companyName} support.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  ja: (v) => ({
    footer: `本メールは送信専用です。お問い合わせは${v.companyName}カスタマーサポートまでご連絡ください。`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  de: (v) => ({
    footer: `Diese Nachricht stammt von einer reinen Versandadresse. Bei Fragen wenden Sie sich bitte an den ${v.companyName}-Kundenservice.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  es: (v) => ({
    footer: `Este es un buzón solo de envío. Para consultas, contacta con el soporte de ${v.companyName}.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  fr: (v) => ({
    footer: `Cette adresse est uniquement utilisée pour l'envoi. Pour toute demande, veuillez contacter le support ${v.companyName}.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  ms: (v) => ({
    footer: `E-mel ini untuk penghantaran sahaja. Untuk pertanyaan, sila hubungi sokongan ${v.companyName}.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
};

function resolveChrome(vars: AdminAnnouncementMailVars, lang: LanguageCodeUnion): AnnouncementChrome {
  return (CHROME_STRINGS[lang] ?? CHROME_STRINGS['en-US'])(vars);
}

/**
 * 관리자가 보내는 일반 공지 템플릿. 헤더(제품명) / 푸터(footer/copyright) 만 lang 별로 분기,
 * 본문 (bodyHtml) 은 admin 입력 그대로 — 본문 다국어는 admin 의 책임.
 *
 * 주의: bodyHtml 은 escape 하지 않는다 (admin 이 의도적으로 HTML 작성). XSS 위험은 admin 권한 신뢰에 위임.
 */
export const AdminAnnouncementMailTemplate: MailTemplate<AdminAnnouncementMailVars> = {
  buildSubject: (v) => `[${v.productName}] ${v.subject}`,

  buildHtml: (vars, lang) => {
    const c = resolveChrome(vars, lang);
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:24px 40px;border-bottom:1px solid #eeeeee;font-size:14px;color:#666666;font-weight:600;">
              ${vars.productName}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;font-size:15px;line-height:1.6;color:#222222;">
              ${vars.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 32px 40px;border-top:1px solid #eeeeee;font-size:12px;color:#999999;">
              <p style="margin:0;">${c.footer}</p>
              <p style="margin:8px 0 0 0;">${c.copyright}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  },

  buildText: (vars, lang) => {
    const c = resolveChrome(vars, lang);
    return `[${vars.productName}] ${vars.subject}\n\n${stripHtml(vars.bodyHtml)}\n\n${c.footer}\n${c.copyright}`;
  },
};

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
