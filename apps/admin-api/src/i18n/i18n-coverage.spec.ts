import * as fs from 'fs';
import * as path from 'path';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminApiError } from '../support/error/AdminApiError';

const LOCALE_DIR = path.join(__dirname, 'locale');
const LANGUAGES = ['ko', 'en-US', 'ja', 'de', 'es', 'fr', 'ms'];

/**
 * 모든 enum 에러 code 가 각 언어의 번역 JSON 파일에 키로 존재하는지 검증.
 * 신규 에러 추가 시 번역 누락 → 빌드 시점에 catch.
 * 정책: 중복(여러 namespace 에 같은 code) 허용. JSON 에 enum 외 추가 키는 허용 (지금은 Lokalise 동기화 진행 중).
 */
describe('admin-api i18n coverage', () => {
  describe('AdminError.json (AdminApiError enum)', () => {
    const requiredCodes = AdminApiError.values().map((e) => e.code);

    it.each(LANGUAGES)('%s: 모든 AdminApiError code 가 번역되어 있다', (lang) => {
      const filePath = path.join(LOCALE_DIR, lang, 'AdminError.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const json = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, string>;
      const missingKeys = requiredCodes.filter((code) => !(code in json));
      expect(missingKeys).toEqual([]);
    });
  });

  describe('CoreError.json (CoreDomainError enum)', () => {
    const requiredCodes = CoreDomainError.values().map((e) => e.code);

    it.each(LANGUAGES)('%s: 모든 CoreDomainError code 가 번역되어 있다', (lang) => {
      const filePath = path.join(LOCALE_DIR, lang, 'CoreError.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const json = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, string>;
      const missingKeys = requiredCodes.filter((code) => !(code in json));
      expect(missingKeys).toEqual([]);
    });
  });
});
