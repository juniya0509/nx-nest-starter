#!/usr/bin/env node

// 선택한 앱의 .env 파일을 base64 로 인코딩해 stdout 으로 출력하고 가능하면 클립보드에 복사한다.
// 사용: `pnpm encoding-env-base64`
// 흐름: app → 환경(development / production)
// 결과 파일: apps/<app>/.env.<environment>

import { select } from '@inquirer/prompts';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const app = await select({
  message: '대상 애플리케이션',
  choices: [
    { name: 'admin-api', value: 'admin-api' },
    { name: 'core-api', value: 'core-api' },
    { name: 'batch', value: 'batch' },
  ],
});

const environment = await select({
  message: '대상 환경',
  choices: [
    { name: 'development', value: 'development' },
    { name: 'production', value: 'production' },
  ],
});

const filename = `.env.${environment}`;
const filePath = resolve(ROOT, 'apps', app, filename);

let buffer;
try {
  buffer = await readFile(filePath);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(`\n❌ 파일이 존재하지 않습니다: ${filePath}\n`);
    process.exit(1);
  }
  throw err;
}

const encoded = buffer.toString('base64');

console.log(`\n=== ${app}/${filename} → base64 ===`);
console.log(encoded);
console.log('=== end ===\n');

await copyToClipboard(encoded).catch(() => {});

async function copyToClipboard(text) {
  const platform = process.platform;
  let cmd;
  let args = [];
  if (platform === 'darwin') {
    cmd = 'pbcopy';
  } else if (platform === 'linux') {
    cmd = 'xclip';
    args = ['-selection', 'clipboard'];
  } else {
    return;
  }

  await new Promise((res, rej) => {
    const proc = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'ignore'] });
    proc.on('error', rej);
    proc.on('close', (code) => (code === 0 ? res() : rej(new Error(`${cmd} exit ${code}`))));
    proc.stdin.write(text);
    proc.stdin.end();
  });

  console.log(`(클립보드 복사 완료: ${cmd})`);
}
