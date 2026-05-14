import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

import { MailTemplate } from './MailTemplate';

export type WelcomeMailVars = {
  recipientName: string;
  companyName: string;
  productName: string;
};

type WelcomeStrings = {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  footer: string;
  copyright: string;
};

const STRINGS: Record<LanguageCodeUnion, (v: WelcomeMailVars) => WelcomeStrings> = {
  ko: (v) => ({
    subject: `${v.productName} 가입을 환영합니다!`,
    greeting: `${escapeHtml(v.recipientName)} 님, 안녕하세요.`,
    body: `${v.productName} 회원가입이 정상적으로 완료되었습니다. 지금 바로 서비스를 시작해보세요.`,
    closing: '앞으로도 더 나은 경험을 제공하기 위해 노력하겠습니다.',
    footer: `본 메일은 발신 전용입니다. 문의는 ${v.companyName} 고객센터로 부탁드립니다.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  'en-US': (v) => ({
    subject: `Welcome to ${v.productName}!`,
    greeting: `Hi ${escapeHtml(v.recipientName)},`,
    body: `Your ${v.productName} account has been successfully created. You're all set to start exploring.`,
    closing: 'We look forward to providing you with a great experience.',
    footer: `This is a send-only mailbox. For inquiries, please contact ${v.companyName} support.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  ja: (v) => ({
    subject: `${v.productName}へようこそ！`,
    greeting: `${escapeHtml(v.recipientName)} 様`,
    body: `${v.productName}への会員登録が正常に完了しました。今すぐサービスをご利用いただけます。`,
    closing: '今後ともより良い体験を提供できるよう努めてまいります。',
    footer: `本メールは送信専用です。お問い合わせは${v.companyName}カスタマーサポートまでご連絡ください。`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  de: (v) => ({
    subject: `Willkommen bei ${v.productName}!`,
    greeting: `Hallo ${escapeHtml(v.recipientName)},`,
    body: `Ihre Anmeldung bei ${v.productName} war erfolgreich. Sie können den Dienst nun nutzen.`,
    closing: 'Wir bemühen uns weiterhin, Ihnen ein noch besseres Erlebnis zu bieten.',
    footer: `Diese Nachricht stammt von einer reinen Versandadresse. Bei Fragen wenden Sie sich bitte an den ${v.companyName}-Kundenservice.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  es: (v) => ({
    subject: `¡Bienvenido a ${v.productName}!`,
    greeting: `Hola ${escapeHtml(v.recipientName)},`,
    body: `Tu registro en ${v.productName} se ha completado correctamente. Ya puedes empezar a usar el servicio.`,
    closing: 'Seguiremos esforzándonos por ofrecerte una mejor experiencia.',
    footer: `Este es un buzón solo de envío. Para consultas, contacta con el soporte de ${v.companyName}.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  fr: (v) => ({
    subject: `Bienvenue sur ${v.productName} !`,
    greeting: `Bonjour ${escapeHtml(v.recipientName)},`,
    body: `Votre inscription à ${v.productName} a bien été enregistrée. Vous pouvez dès à présent utiliser le service.`,
    closing: 'Nous nous engageons à vous offrir une expérience toujours meilleure.',
    footer: `Cette adresse est uniquement utilisée pour l'envoi. Pour toute demande, veuillez contacter le support ${v.companyName}.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
  ms: (v) => ({
    subject: `Selamat datang ke ${v.productName}!`,
    greeting: `Hai ${escapeHtml(v.recipientName)},`,
    body: `Pendaftaran anda di ${v.productName} telah berjaya. Anda boleh mula menggunakan perkhidmatan kami sekarang.`,
    closing: 'Kami akan terus berusaha untuk memberikan pengalaman yang lebih baik.',
    footer: `E-mel ini untuk penghantaran sahaja. Untuk pertanyaan, sila hubungi sokongan ${v.companyName}.`,
    copyright: `© ${new Date().getFullYear()} ${v.companyName}`,
  }),
};

function resolveStrings(vars: WelcomeMailVars, lang: LanguageCodeUnion): WelcomeStrings {
  return (STRINGS[lang] ?? STRINGS['en-US'])(vars);
}

/**
 * 회원가입 완료 안내 메일 템플릿. 자동 발송 전용.
 * 인라인 CSS — 대부분의 메일 클라이언트가 <head><style> 을 무시하므로 인라인 권장.
 */
export const WelcomeMailTemplate: MailTemplate<WelcomeMailVars> = {
  buildSubject: (vars, lang) => resolveStrings(vars, lang).subject,

  buildHtml: (vars, lang) => {
    const s = resolveStrings(vars, lang);
    return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 16px 40px;">
              <h1 style="margin:0;font-size:22px;color:#111111;">${s.subject} 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;font-size:15px;line-height:1.6;color:#444444;">
              <p style="margin:0 0 12px 0;">${s.greeting}</p>
              <p style="margin:0 0 12px 0;">${s.body}</p>
              <p style="margin:24px 0 0 0;color:#888888;font-size:13px;">${s.closing}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 32px 40px;border-top:1px solid #eeeeee;font-size:12px;color:#999999;">
              <p style="margin:0;">${s.footer}</p>
              <p style="margin:8px 0 0 0;">${s.copyright}</p>
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
    const s = resolveStrings(vars, lang);
    return `${s.subject}\n\n${s.greeting}\n${s.body}\n\n${s.footer}\n${s.copyright}`;
  },
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
