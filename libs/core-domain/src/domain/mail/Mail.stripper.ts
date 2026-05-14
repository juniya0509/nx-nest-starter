import { Injectable } from '@nestjs/common';

/**
 * HTML 문자열에서 태그를 제거해 plain-text fallback 을 만든다.
 * 메일 클라이언트가 HTML 비활성일 때 보여줄 text 부분 생성에 사용.
 *
 * 정밀 sanitizer 가 아님 — 단순 태그 제거 + 줄바꿈 정리.
 * (XSS 방지 용도로는 사용하지 말 것)
 */
@Injectable()
export class MailStripper {
  strip(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
