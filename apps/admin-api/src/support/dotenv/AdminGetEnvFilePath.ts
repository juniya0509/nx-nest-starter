import { existsSync } from 'fs';
import { resolve } from 'path';

const adminGetEnvFilePath = (): string => {
  // NODE_ENV 미지정 시 'local' 로 fallback — 도구 스크립트(i18n:download / swagger:generate)
  // 를 로컬에서 prefix 없이 호출 가능하게 한다.
  // 앱 부팅은 start:local/development/production 명령에서 NODE_ENV 가 명시되므로 영향 없음.
  const nodeEnv = process.env.NODE_ENV || 'local';
  const cwd = process.cwd();

  const isInAppDir = cwd.endsWith('apps/admin-api');

  const envPath = isInAppDir ? resolve(cwd, `.env.${nodeEnv}`) : resolve(cwd, 'apps/admin-api', `.env.${nodeEnv}`);

  if (!existsSync(envPath) && nodeEnv !== 'test') {
    console.warn(`.env file not found at: ${envPath}`);
  }

  return envPath;
};

export default adminGetEnvFilePath;
