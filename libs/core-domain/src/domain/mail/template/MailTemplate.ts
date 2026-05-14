import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

/**
 * 이메일 템플릿 표준 인터페이스.
 * subject / html / text 각각을 변수 + 언어 코드로부터 생성하는 함수 묶음.
 * - text: HTML 비활성 클라이언트 / 스팸 필터 호환을 위한 평문 fallback (필수)
 * - lang: 미지원 코드는 각 템플릿 내부에서 'en-US' 로 fallback
 */
export interface MailTemplate<TVars> {
  buildSubject(vars: TVars, lang: LanguageCodeUnion): string;
  buildHtml(vars: TVars, lang: LanguageCodeUnion): string;
  buildText(vars: TVars, lang: LanguageCodeUnion): string;
}
