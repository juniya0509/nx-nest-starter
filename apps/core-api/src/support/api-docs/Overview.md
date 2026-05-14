# Overview

> Nx Nest Starter Core API 문서입니다.

## API URL

**Dev Server URL** : `https://core-api.dev.example.com`
**Prod Server URL** : `https://core-api.example.com`

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

1. `Auth` 엔드포인트를 통해 OAuth2 / OTP 로그인
2. 발급받은 `Access JWT`를 클라이언트에 저장
3. 인증이 필요한 요청 시 `Access JWT`를 `Authorization` 헤더에 포함

**[Authorization 헤더 예시]**

```bash
--header 'Authorization: Bearer <access-jwt>'
```

**[Access JWT 만료 시]**

- 만료된 토큰으로 요청 시 `401 Unauthorized` + `EXPIRED_JWT_ACCESS_TOKEN` 응답을 받습니다.
- 재로그인을 하거나, 저장해둔 Refresh JWT로 재발급 요청을 보내주세요 — `POST /v1/auth/refresh` 참고

**[Apidog에서의 인증 테스트]**

- 로그인 엔드포인트를 통해 발급받은 Access JWT를 Apidog의 `우측상단메뉴` → `ENVIRONMENTS` → `적용할 Env` 아래에 기입
  - Variable : `bearerToken`
  - Type : `Default`
  - Initial Value : 발급받은 Access JWT
  - Current Value : 발급받은 Access JWT

> API 문서에서는 적용이 안 되며, Apidog 소프트웨어에서만 적용됩니다.

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

| HTTP Status               | Error Code                | Description                                |
| ------------------------- | ------------------------- | ------------------------------------------ |
| 400 - BadRequest          | DEFAULT_BAD_REQUEST_ERROR | 클라이언트가 올바르지 않은 요청을 보냄     |
| 401 - Unauthorized        | NON_EXISTENT_USER         | 존재하지 않는 유저                         |
| 401 - Unauthorized        | NOT_ACTIVED_USER          | 활성화되지 않은 유저 (탈퇴/삭제 상태)      |
| 401 - Unauthorized        | SUSPENDED_USER            | 활동이 정지된 유저                         |
| 401 - Unauthorized        | INVALID_JWT_ACCESS_TOKEN  | 유효하지 않은 Access JWT                   |
| 401 - Unauthorized        | EXPIRED_JWT_ACCESS_TOKEN  | 만료된 Access JWT                          |
| 401 - Unauthorized        | INVALID_JWT_REFRESH_TOKEN | 유효하지 않은 Refresh JWT                  |
| 401 - Unauthorized        | EXPIRED_JWT_REFRESH_TOKEN | 만료된 Refresh JWT                         |
| 404 - NotFound            | DEFAULT_NOT_FOUND         | 존재하지 않는 경로                         |
| 404 - NotFound            | USER_NOT_FOUND            | 존재하지 않는 유저                         |
| 413 - PayloadTooLarge     | PAYLOAD_TOO_LARGE         | 요청한 파일이 너무 큼                      |
| 415 - UnsupportedMedia    | UNSUPPORTED_FILE_FORMAT   | 지원하지 않는 파일 확장자                  |
| 500 - InternalServerError | DEFAULT_ERROR             | 서버 에러                                  |
