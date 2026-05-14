import * as fs from 'fs';
import * as path from 'path';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { ApiError } from '../support/error/ApiError';

const LOCALE_DIR = path.join(__dirname, 'locale');
const LANGUAGES = ['ko', 'en-US', 'ja', 'de', 'es', 'fr', 'ms'];

/**
 * 모든 enum 에러 code 가 각 언어의 번역 JSON 파일에 키로 존재하는지 검증.
 * 신규 에러 추가 시 번역 누락 → 빌드 시점에 catch.
 * core-api 는 ApiError / CoreDomainError 모두 단일 CoreError.json 으로 통합 관리.
 */
describe('core-api i18n coverage', () => {
  describe('CoreError.json (ApiError + CoreDomainError 통합)', () => {
    const requiredCodes = Array.from(new Set([...ApiError.values().map((e) => e.code), ...CoreDomainError.values().map((e) => e.code)]));

    it.each(LANGUAGES)('%s: 모든 ApiError + CoreDomainError code 가 번역되어 있다', (lang) => {
      const filePath = path.join(LOCALE_DIR, lang, 'CoreError.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const json = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, string>;
      const missingKeys = requiredCodes.filter((code) => !(code in json));
      expect(missingKeys).toEqual([]);
    });
  });
});
