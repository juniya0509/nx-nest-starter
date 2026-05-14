import { LanguageCodeUnion } from '@libs/core-enum/src/Language.enum';

/**
 * Push 알림 템플릿 표준 인터페이스.
 * device.language 별로 분기되는 title/body, 그리고 device 무관한 data payload (선택).
 *
 * - data: FCM 의 `data` 필드 (deeplink 등 클라이언트 라우팅 정보).
 *   값은 FCM 규격상 string 만 가능. 클라이언트가 number 가 필요하면 string 으로 보낸 뒤 파싱.
 */
export interface PushTemplate<TVars> {
  buildTitle(vars: TVars, lang: LanguageCodeUnion): string;
  buildBody(vars: TVars, lang: LanguageCodeUnion): string;
  buildData?(vars: TVars): Record<string, string>;
}
