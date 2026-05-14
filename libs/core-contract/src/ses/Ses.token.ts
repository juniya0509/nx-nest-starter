/**
 * AWS SES SDK 클라이언트(SESClient) 의 NestJS DI 토큰.
 *
 * core-domain 의 MailSender 가 이 토큰으로 SESClient 를 inject 받고,
 * 각 앱(core-api / admin-api) 의 메일 모듈이 ConfigService 기반 factory 로 SESClient 를 등록한다.
 */
export const SES_CLIENT_TOKEN = 'SES_CLIENT';
