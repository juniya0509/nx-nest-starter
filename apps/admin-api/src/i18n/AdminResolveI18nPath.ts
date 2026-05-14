import { existsSync } from 'fs';
import path from 'path';

const adminResolveI18nPath = (): string => {
  const cwd = process.cwd();
  const dir = __dirname;

  if (dir.includes('/dist/')) {
    const distPath = path.join(dir, '../../i18n/locale');
    if (existsSync(distPath)) return distPath;
  }

  const localPath = path.join(cwd, 'src/i18n/locale');
  if (existsSync(localPath)) return localPath;

  const srcPath = path.join(dir, '../i18n/locale');
  if (existsSync(srcPath)) return srcPath;

  const fallback = path.resolve(cwd, 'apps/admin-api/src/i18n/locale');
  console.warn(`[i18n] fallback path used: ${fallback}`);
  return fallback;
};

export default adminResolveI18nPath;
