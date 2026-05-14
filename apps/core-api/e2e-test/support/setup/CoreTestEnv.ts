/**
 * core-api E2E 테스트가 ConfigModule(Joi) 검증을 통과할 수 있도록 비-DB 환경 변수를 stub 처리.
 * MySQL 관련 변수는 testcontainers 가 컨테이너 기동 후에 별도로 설정한다.
 */
export function setCoreTestEnv(): void {
  const stubs: Record<string, string> = {
    NODE_ENV: 'test',
    API_APP_NAME: 'core-api',
    SERVER_PORT: '0',
    CORE_WEB_URL: 'http://localhost',
    ACCESS_JWT_SECRET_KEY: 'test-access-secret',
    ACCESS_JWT_EXPIRES_IN_SECOND: '3600',
    REFRESH_JWT_SECRET_KEY: 'test-refresh-secret',
    REFRESH_JWT_EXPIRES_IN_SECOND: '604800',
    AWS_S3_URL: 'stub',
    AWS_S3_ACCESS_KEY: 'stub',
    AWS_S3_SECRET_ACCESS_KEY: 'stub',
    AWS_S3_BUCKET_NAME: 'stub',
    AWS_S3_REGION: 'stub',
    AWS_CLOUD_FRONT_RES_URL: 'stub',
    SES_ACCESS_KEY: 'stub',
    SES_SECRET_KEY: 'stub',
    SES_REGION: 'ap-northeast-2',
    SES_FROM_EMAIL: 'noreply@example.com',
    SES_FROM_NAME: '',
    MAIL_COMPANY_NAME: 'TestCo',
    MAIL_PRODUCT_NAME: 'TestProduct',
    SENTRY_CLIENT_DSN_KEY: 'stub',
    SLACK_SERVER_ERROR_WEBHOOK_URL: 'stub',
    SLACK_SERVER_SLOW_QUERY_WEBHOOK_URL: 'stub',
    TWILIO_ACCOUNT_SID: 'stub',
    TWILIO_AUTH_TOKEN: 'stub',
    TWILIO_PHONE_NUMBER: 'stub',
    TWILIO_WHATS_APP_PHONE_NUMBER: 'stub',
    LOKALISE_API_TOKEN: 'stub',
    LOKALISE_PROJECT_ID: 'stub',
    FIREBASE_PROJECT_ID: 'stub',
    FIREBASE_CLIENT_EMAIL: 'stub',
    FIREBASE_PRIVATE_KEY_BASE64: 'stub',
    LOGTO_ENDPOINT: 'http://localhost',
  };

  for (const [key, value] of Object.entries(stubs)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
