/**
 * 관리자가 직접 호출 가능한 메일 템플릿 식별자.
 * 신규 템플릿 추가 시 이 union 에 등록 → AdminMailService.sendBulkByTemplate 의 분기에 추가.
 */
export const ADMIN_MAIL_TEMPLATE_IDS = ['announcement'] as const;
export type AdminMailTemplateId = (typeof ADMIN_MAIL_TEMPLATE_IDS)[number];
