/**
 * batch E2E 테스트가 ConfigModule(Joi) 검증을 통과할 수 있도록 비-DB 환경 변수를 stub 처리.
 * MySQL 관련 변수는 testcontainers 가 컨테이너 기동 후에 별도로 설정한다.
 */
export function setBatchTestEnv(): void {
  const stubs: Record<string, string> = {
    NODE_ENV: 'test',
    API_APP_NAME: 'batch',
    SERVER_PORT: '0',
    SENTRY_CLIENT_DSN_KEY: 'stub',
    SLACK_SERVER_ERROR_WEBHOOK_URL: 'stub',
  };

  for (const [key, value] of Object.entries(stubs)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
