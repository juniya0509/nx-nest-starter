/**
 * Firebase Admin App 인스턴스의 NestJS DI 토큰.
 *
 * core-domain 의 PushSender 가 이 토큰으로 admin App 을 inject 받고,
 * 각 앱(core-api / admin-api) 의 push 모듈이 ConfigService 기반 factory 로 admin.initializeApp 을 호출해 등록한다.
 */
export const FIREBASE_APP_TOKEN = 'FIREBASE_APP';
