---
name: error-handling
description: 앱별 에러 상수 파일 위치와 사용 규칙. Nest.js Exception throw, 새 에러 코드 추가 시. `core-api` → `apps/core-api/src/support/error/ApiError.ts`, 공용 도메인 → `libs/core-domain/src/support/error/CoreDomainError.ts`, `admin-api` → `apps/admin-api/src/support/error/AdminApiError.ts`, `batch` → `apps/batch/src/support/error/BatchError.ts` 구분 적용 시 사용. Swagger 에러 명세 연결은 `swagger-api` skill 참고.
---

# 에러 핸들링 규칙

에러 코드는 반드시 **앱별 에러 정의 파일**에 상수로 선언하고 import해서 사용합니다.

| 대상 | 파일 경로 | 상수 |
| - | - | - |
| Core API | `/apps/core-api/src/support/error/ApiError.ts` | `ApiError` |
| Core Domain (libs 공용) | `/libs/core-domain/src/support/error/CoreDomainError.ts` | `CoreDomainError` |
| Admin API | `/apps/admin-api/src/support/error/AdminApiError.ts` | `AdminApiError` |
| Batch | `/apps/batch/src/support/error/BatchError.ts` | `BatchError` (cron 실행 단위 에러. `JOB_FAILED` 등) |

## 사용 예

```ts
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

throw new NotFoundException(CoreDomainError.USER_NOT_FOUND);
```

## 어디에 무엇을 두는가
- 여러 앱(`core-api`, `admin-api`, `batch`)에서 동일하게 발생할 수 있는 도메인 공통 에러 → `CoreDomainError`.
- `core-api` 전용(예: Application Layer 로직) → `ApiError`.
- `admin-api` 전용(예: 어드민 전용 검증/권한) → `AdminApiError`.
- `batch` 전용(예: cron 실행 실패 분류) → `BatchError`. (실 cron 흐름 자체의 try/catch + logger/Sentry/Slack 통합은 `BatchExceptionHandler.execute(...)` wrapper 가 처리.)

## Swagger 연결
- Controller에서 `@SwaggerApiResponseError` / `@AdminSwaggerApiResponseError`에 해당 에러 코드를 선언해 클라이언트 명세에 포함시킵니다.
- 에러가 여러 개면 배열로, HTTP 상태 코드가 다르면 데코레이터를 분리합니다.

## 금지 사항
- `try/catch` 사용 금지 — `neverthrow`로 결과를 반환합니다 (자세한 내용은 `code-anti-patterns` skill 참고).
- 임의의 문자열/코드로 `throw`하지 말고 **반드시 위 에러 상수 파일**에서 참조해 사용합니다.
