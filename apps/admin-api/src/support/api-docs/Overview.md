# Overview

> Nx Nest Starter Admin API 문서입니다.

## API URL

**Dev Server URL** : `https://admin-api.dev.example.com`
**Prod Server URL** : `https://admin-api.example.com`

> 테스트는 Dev Server URL에서 진행하고, API Testing 소프트웨어에서 Prod Server URL로의 테스트는 지양해주세요.

## Client Language

모든 API를 요청할 때는 **현재 클라이언트의 언어 코드**를 같이 전송해야 합니다.
언어 코드를 전송하지 않을 시 **기본 언어**인 영어 `en-US`로 처리됩니다.
이 값은 **HTTP Header에** `x-user-lang`으로 전달합니다.

**[지원하는 언어]**

```json
{
  "en-US": "English",
  "ko": "한국어",
  "fr": "Français",
  "es": "Español",
  "de": "Deutsch",
  "ja": "日本語"
}
```

**[요청 헤더 예시]**

```bash
--header 'x-user-lang: ko'
```

## 사용자 인증 (Authentication)

> 인증이 필요한 API는 `Bearer 토큰 방식`을 사용합니다.

1. **Core API**의 `Auth` 엔드포인트를 통해 OAuth2 / OTP 로그인
2. 발급받은 `Access JWT`를 클라이언트에 저장
3. 인증이 필요한 요청 시 `Access JWT`를 `Authorization` 헤더에 포함

> Admin API와 Core API는 **동일한 Access JWT를 공유**합니다. 별도의 관리자 로그인 엔드포인트가 없으므로, Core API에서 발급받은 토큰을 그대로 Admin API 호출에도 사용해주세요. 일반 사용자가 관리자로 등록되어도 재로그인이 필요하지 않습니다.

**[Authorization 헤더 예시]**

```bash
--header 'Authorization: Bearer <access-jwt>'
```

**[Access JWT 만료 시]**

- 만료된 토큰으로 요청 시 `401 Unauthorized` + `EXPIRED_JWT_ACCESS_TOKEN` 응답을 받습니다.
- 재로그인을 하거나, 저장해둔 Refresh JWT로 재발급 요청을 보내주세요.
- Refresh / 재발급 엔드포인트는 **Core API에서만 제공**됩니다 — `[Core API] POST /v1/auth/refresh` 참고

**[Apidog에서의 인증 테스트]**

- Core API의 로그인 엔드포인트를 통해 발급받은 Access JWT를 Apidog의 `우측상단메뉴` → `ENVIRONMENTS` → `적용할 Env` 아래에 기입
  - Variable : `bearerToken`
  - Type : `Default`
  - Initial Value : 발급받은 Access JWT
  - Current Value : 발급받은 Access JWT

> API 문서에서는 적용이 안 되며, Apidog 소프트웨어에서만 적용됩니다.

## 관리자 권한 (Authorization)

Admin API의 모든 엔드포인트는 **관리자로 등록된 사용자**만 호출할 수 있습니다.
또한 각 엔드포인트는 호출에 필요한 **세부 권한**을 별도로 요구할 수 있습니다.

### 관리자 자격

- 일반 사용자 계정으로 로그인했더라도, 운영팀이 해당 사용자를 **관리자로 등록**하지 않았다면 Admin API 호출 시 `403 Forbidden` 응답을 받습니다.
- 관리자 등록 / 권한 부여 / 권한 회수는 운영팀이 어드민 운영 도구에서 처리합니다. 클라이언트가 직접 관리자 자격이나 권한을 변경할 수 있는 API는 제공되지 않습니다.

### 권한 매칭 규칙

각 엔드포인트는 두 가지 방식으로 권한을 요구할 수 있습니다.

- **Required Permissions (ALL)** — 표기된 **모든** 권한을 보유해야 호출 가능 (AND)
- **Required Permissions (ANY)** — 표기된 권한 중 **하나 이상** 보유하면 호출 가능 (OR)
- 둘 다 지정된 경우 — `ALL` 모두 만족 **+** `ANY` 중 하나 이상 만족해야 호출 가능

요구되는 권한은 **각 API 문서의 `description` 항목 하단**에 표기됩니다.

**[표기 예시 1] — 모든 권한 보유 필요 (AND)**

```text
Required Permissions (ALL): `PRODUCT_CREATE` (상품 등록), `PRODUCT_UPDATE` (상품 수정)
```

**[표기 예시 2] — 권한 중 하나라도 보유 (OR)**

```text
Required Permissions (ANY): `USER_READ` (유저 단건 조회), `USER_LIST` (유저 목록 조회)
```

**[표기 예시 3] — 둘 다 지정**

```text
Required Permissions (ALL): `PRODUCT_READ` (상품 단건 조회)
Required Permissions (ANY): `PRODUCT_CREATE` (상품 등록), `PRODUCT_UPDATE` (상품 수정)
```

### 권한 부족 시 응답

권한이 부족한 사용자가 API를 호출하면 아래 응답을 받습니다.

- HTTP `403 Forbidden`
- Error Code `DO_NOT_HAVE_PERMISSION`

이 응답은 다음 세 가지 케이스에서 **동일하게** 발생합니다 (응답으로는 케이스 구분 불가).

- 관리자가 아닌 일반 사용자가 호출한 경우
- 관리자였지만 정지된 상태에서 호출한 경우
- 관리자이지만 해당 엔드포인트가 요구하는 권한을 보유하지 않은 경우

### 클라이언트 구현 가이드

- **권한 캐시** — 로그인 직후 또는 관리자 본인 정보 조회 API를 통해 보유 권한 코드 목록을 받아 캐시해두면, 화면 진입 전에 사전 차단이 가능합니다.
- **UI 사전 차단** — 사용자가 보유하지 않은 권한이 필요한 메뉴 / 버튼은 숨기거나 비활성화해주세요. 서버 단에서 차단되더라도 UX 차원에서 클라이언트 차단을 권장합니다.
- **403 응답 처리** — `DO_NOT_HAVE_PERMISSION` 응답을 받으면 "접근 권한이 없습니다" 같은 안내를 보여주세요. 운영팀이 직전에 권한을 부여/회수했을 경우 캐시된 권한이 stale일 수 있으니, 가능하다면 권한 정보 새로고침 또는 재로그인을 유도해주세요.

## API Response

모든 API 응답은 아래 구조를 따릅니다.
**단, `Health` 관련 API들은 공통 응답 구조를 따르지 않습니다.**
자세한 내용은 각 API 엔드포인트 문서를 참고하세요.

```json
{
  "result": "SUCCESS" 또는 "ERROR",
  "data": {Success Data} 또는 null,
  "error": {Error Data} 또는 null
}
```

**[API 성공 예시] — 성공 데이터가 없을 경우**

```json
{
  "result": "SUCCESS",
  "data": null,
  "error": null
}
```

**[API 성공 예시] — 성공 데이터가 있는 경우**

```json
{
  "result": "SUCCESS",
  "data": {
    "exampleId": 0,
    "exampleName": "string"
  },
  "error": null
}
```

**[API 실패 예시] — 에러 데이터가 없는 경우**

```json
{
  "result": "ERROR",
  "data": null,
  "error": {
    "traceId": "string",
    "code": "string",
    "message": "string",
    "data": null
  }
}
```

**[API 실패 예시] — 에러 데이터가 있는 경우**

```json
{
  "result": "ERROR",
  "data": null,
  "error": {
    "traceId": "string",
    "code": "string",
    "message": "string",
    "data": {
      "exampleId": 0,
      "exampleName": "string"
    }
  }
}
```

### Response Date Type

모든 Date 필드는 **ISO 8601** 형식으로 반환됩니다.
기준 **Timezone**은 `UTC` 입니다. 클라이언트에서 사용자 환경에 맞춰 변환해주세요.

**[Response Date Field 예시]**

```json
{
  "exampleDate": "2024-10-18T09:46:11.565Z"
}
```

**[Date 변환 예시 — `dayjs` 사용]**

```typescript
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// tz는 IANA Timezone identifier (예: 'Asia/Seoul', 'America/New_York', 'UTC')
function formatDate(date: Date, locale: LanguageCodeUnion, tz: string): string {
  if (locale === 'ko') {
    return dayjs(date).tz(tz).format('YYYY년 MM월 DD일 HH:mm:ss');
  }

  return dayjs(date).tz(tz).format('MMM D YYYY, HH:mm:ss');
}
```

### Response Array Type

모든 Array 필드는 문서에 별도로 `undefined` 또는 `null` 표시가 없으면 값이 없을 경우 무조건 **Empty Array** 형식으로 반환됩니다.
값이 없는 경우도 있을 수 있으므로 항상 **Empty Array**가 아닌지 체크해야 합니다.

**[Response Array Field 예시]**

값이 없는 경우

```json
{
  "numberList": []
}
```

값이 있는 경우

```json
{
  "numberList": [1, 2, 3, 4, 5]
}
```

### Common Error Response

API를 호출했을 때 공통적으로 발생할 수 있는 에러입니다.

| HTTP Status               | Error Code                | Description                                                |
| ------------------------- | ------------------------- | ---------------------------------------------------------- |
| 400 - BadRequest          | DEFAULT_BAD_REQUEST_ERROR | 클라이언트가 올바르지 않은 요청을 보냄                     |
| 401 - Unauthorized        | NOT_LOGGED_IN             | `Authorization` 헤더 누락 또는 `Bearer` 형식이 아님        |
| 401 - Unauthorized        | INVALID_JWT_ACCESS_TOKEN  | 유효하지 않은 Access JWT (위조/변조)                       |
| 401 - Unauthorized        | EXPIRED_JWT_ACCESS_TOKEN  | 만료된 Access JWT                                          |
| 401 - Unauthorized        | NOT_ACTIVED_USER          | 활성화되지 않은 유저 (탈퇴/삭제 상태)                      |
| 401 - Unauthorized        | SUSPENDED_USER            | 활동이 정지된 유저                                         |
| 403 - Forbidden           | DO_NOT_HAVE_PERMISSION    | 관리자 자격이 없거나, 정지된 관리자이거나, 권한이 부족함   |
| 404 - NotFound            | DEFAULT_NOT_FOUND         | 존재하지 않는 경로                                         |
| 404 - NotFound            | USER_NOT_FOUND            | 존재하지 않는 유저                                         |
| 413 - PayloadTooLarge     | PAYLOAD_TOO_LARGE         | 요청한 파일이 너무 큼                                      |
| 415 - UnsupportedMedia    | UNSUPPORTED_FILE_FORMAT   | 지원하지 않는 파일 확장자                                  |
| 500 - InternalServerError | DEFAULT_ERROR             | 서버 에러                                                  |
