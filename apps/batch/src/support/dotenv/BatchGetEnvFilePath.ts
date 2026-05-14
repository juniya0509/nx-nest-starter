import { existsSync } from 'fs';
import { resolve } from 'path';

const batchGetEnvFilePath = (): string => {
  // NODE_ENV 미지정 시 'local' 로 fallback — admin/core 와 일관.
  // 앱 부팅은 start:local/development/production 명령에서 NODE_ENV 가 명시되므로 영향 없음.
  const nodeEnv = process.env.NODE_ENV || 'local';
  const cwd = process.cwd();

  const isInAppDir = cwd.endsWith('apps/batch');
  const envPath = isInAppDir ? resolve(cwd, `.env.${nodeEnv}`) : resolve(cwd, 'apps/batch', `.env.${nodeEnv}`);

  if (!existsSync(envPath) && nodeEnv !== 'test') {
    console.warn(`.env file not found at: ${envPath}`);
  }

  return envPath;
};

export default batchGetEnvFilePath;
