---
name: swagger-api
description: Swagger(OpenAPI) API 문서화 데코레이터 규칙. Controller 엔드포인트의 성공 응답(`@SwaggerApiResponseSuccess`)·에러 응답(`@SwaggerApiResponseError`) 명세, `@ApiProperty` 필드 상세, 인증/권한 데코레이터(`@UserAuthGuard`/`@UserAuthGuardOptional`/`@AdminAuth`) 적용, core-api/admin-api 데코레이터 구분 시 사용. **`@AdminAuth` / `@UserAuthGuard` / `@UserAuthGuardOptional`은 Swagger Bearer 마커와 권한 표시까지 자동 처리**하므로 별도 Swagger 인증 데코레이터를 추가하지 않습니다. **API 문서(swagger.json) 에 영향이 가는 변경이 있으면 `pnpm <app> swagger:generate` 로 재생성**합니다. DTO 클래스 **구조/변환 규칙**은 `dto-convention` skill 참고.
---

# Swagger API 문서화 규칙

모든 Request/Response 필드와 모든 Controller 엔드포인트에 Swagger 데코레이터를 **최대한 상세히** 작성합니다. 예시가 필요하면 `example`에 적습니다.

## 필드 문서화 (`@ApiProperty`)

### Request 예시 (enum + 중첩 배열)
```ts
class TermsAgreementReq {
  @ApiProperty({
    type: 'string',
    enum: termsCodeKeys,
    description:
      '약관 코드\n필수 약관 동의 항목 : `SERVICE_TERMS` `SERVICE_PRIVACY` \n선택 약관 동의 항목 : `MARKETING_CONSENT`',
    example: 'SERVICE_TERMS',
  })
  @IsEnum(termsCodeKeys)
  readonly termsCode: TermsCodeUnion;

  @ApiProperty({ type: 'boolean', description: '동의 여부' })
  @IsBoolean()
  readonly isAgreed: boolean;
}

export class CreateUserReq {
  // ...

  @ApiProperty({
    type: [TermsAgreementReq],
    description: '회원가입 시 동의한 약관 목록',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TermsAgreementReq)
  readonly termsAgreementList: TermsAgreementReq[];
}
```

### Response 예시 (페이지네이션)
```ts
export class GetUserListRes {
  @Exclude() private readonly _totalPages: number;
  @Exclude() private readonly _totalResults: number;
  @Exclude() private readonly _userList: User[];

  constructor(totalPages: number, totalResults: number, userList: GetUserResult[]) {
    this._totalPages = totalPages;
    this._totalResults = totalResults;
    this._userList = userList.map((user) => User.of(user));
  }

  @Expose()
  @ApiProperty({ type: 'integer', description: '총 페이지 수' })
  get totalPages(): number { return this._totalPages; }

  @Expose()
  @ApiProperty({ type: 'integer', description: '총 결과 개수' })
  get totalResults(): number { return this._totalResults; }

  @Expose()
  @ApiProperty({ type: [User], description: '유저 목록' })
  @Type(() => User)
  get userList(): User[] { return this._userList; }

  static of(totalPages: number, totalResults: number, userList: GetUserResult[]): GetUserListRes {
    return new GetUserListRes(totalPages, totalResults, userList);
  }
}
```

## Controller 엔드포인트 문서화

각 엔드포인트가 성공/실패 시 어떤 데이터를 반환하는지 반드시 명시합니다.

- **API 성공**: Response DTO → `@SwaggerApiResponseSuccess`
- **API 에러**: Error Code → `@SwaggerApiResponseError`
  - 에러가 여러 개면 **배열로 추가**.
  - **HTTP 상태 코드가 다르면 상태 코드별로 데코레이터를 분리**합니다.

### HTTP 상태 코드 표기

`@SwaggerApiResponseSuccess`, `@SwaggerApiResponseError`, `@HttpCode` 등 HTTP 상태 코드를 인자로 받는 모든 위치에는 **숫자 리터럴(`200`, `201`, `401`, `404` 등)을 직접 사용**합니다. `HttpStatus.OK`, `HttpStatus.UNAUTHORIZED` 같은 enum 표현은 사용하지 않습니다.

```ts
// ✅ Good
@SwaggerApiResponseSuccess(201, AuthTokenRes)
@SwaggerApiResponseError(401, [CoreDomainError.NOT_LOGGED_IN])
@HttpCode(200)

// ❌ Bad
@SwaggerApiResponseSuccess(HttpStatus.CREATED, AuthTokenRes)
@SwaggerApiResponseError(HttpStatus.UNAUTHORIZED, [CoreDomainError.NOT_LOGGED_IN])
@HttpCode(HttpStatus.OK)
```

> 이유: 한 엔드포인트 안에 `201`(`@HttpCode`)과 `HttpStatus.UNAUTHORIZED`가 섞여 보이면 가독성이 떨어집니다. 숫자로 통일하면 어떤 상태 코드인지 한 눈에 보이고, `HttpStatus` import도 불필요해집니다.

## 인증 / 권한 데코레이터

**별도의 Swagger 인증 데코레이터(`@SwaggerApiAuth`, `@AdminSwaggerApiAccessRoles` 등)는 더 이상 사용하지 않습니다.** 인증/인가 데코레이터가 Swagger Bearer 마커와 권한 표기를 모두 자동으로 처리합니다.

### Core API

| 상황 | 데코레이터 | 자동 처리 항목 |
|---|---|---|
| 로그인 필수 | `@UserAuthGuard()` | 런타임 검증 + Swagger Bearer 마커 |
| 로그인 선택 (있으면 검증, 없으면 익명 통과) | `@UserAuthGuardOptional()` | 런타임 검증 + Swagger Bearer 마커 |
| 인증 불필요 (퍼블릭) | (데코레이터 없음) | — |

```ts
@SwaggerApiOperation({ summary: 'Logout', description: '...' })
@SwaggerApiResponseSuccess(200, null, '로그아웃 성공')
@SwaggerApiResponseError(200, [
  CoreDomainError.NOT_LOGGED_IN,
  CoreDomainError.INVALID_JWT_ACCESS_TOKEN,
  CoreDomainError.EXPIRED_JWT_ACCESS_TOKEN,
])
@UserAuthGuard()
@HttpCode(200)
@Post('/v1/auth/logout')
async logout(...) { ... }
```

### Admin API

- 모든 Swagger 데코레이터는 **`Admin` prefix** (예: `@AdminSwaggerApiResponseSuccess`, `@AdminSwaggerApiResponseError`, `@AdminSwaggerApiOperation`, `@AdminSwaggerApiTags`).
- 인증/권한은 **`@AdminAuth`** 단일 데코레이터로 처리.
  - 런타임 인가 + Swagger Bearer 마커 + Swagger description의 `Required Permissions` 표기를 모두 자동 주입합니다.
- 권한 코드는 `apps/admin-api/src/enum/AdminPermission.enum.ts` 의 `AdminPermission` enum 인스턴스를 사용합니다 (자동완성 / refactor-safe).

| 상황 | 데코레이터 |
|---|---|
| 관리자 인증만 필요 (권한 검증 X) | `@AdminAuth()` |
| 모든 권한 보유 필요 (AND) | `@AdminAuth({ requireAll: [AdminPermission.X, AdminPermission.Y] })` |
| 권한 중 하나라도 보유 (OR) | `@AdminAuth({ requireAny: [AdminPermission.X, AdminPermission.Y] })` |
| 둘 다 지정 | `@AdminAuth({ requireAll: [...], requireAny: [...] })` |

```ts
@AdminSwaggerApiOperation({
  summary: 'Get User List',
  description: '전체 유저 목록을 조회합니다.',
})
@AdminSwaggerApiResponseSuccess(200, AdminGetUserListRes)
@AdminAuth({ requireAll: [AdminPermission.USER_LIST] })
@Get('/v1/users')
async getUserList(...) { ... }
```

> 권한 부족 시 `403 Forbidden` + `DO_NOT_HAVE_PERMISSION` 응답이 자동 반환됩니다 (이 에러를 별도로 `@AdminSwaggerApiResponseError`에 명시할 필요 없음 — Overview.md의 Common Error Response에서 안내).

## Swagger 산출물 재생성 (`swagger.json`)

각 앱의 `apps/<app>/src/support/api-docs/swagger.json` 은 빌드 시점에 생성된 정적 파일입니다. **API 문서에 영향이 가는 변경**이 있으면 반드시 재생성합니다.

```bash
pnpm core swagger:generate    # apps/core-api/src/support/api-docs/swagger.json 갱신
pnpm admin swagger:generate   # apps/admin-api/src/support/api-docs/swagger.json 갱신
```

### 재생성이 필요한 변경 (영향 O)

- Controller 엔드포인트 **추가 / 제거 / path / HTTP method** 변경
- Request DTO / Response DTO 의 **필드 추가·제거·타입·optional 여부** 변경
- `@ApiProperty` / `@ApiPropertyOptional` 의 description / type / enum / example / required 등 변경
- `@SwaggerApiOperation` 의 summary / description 변경
- `@SwaggerApiResponseSuccess` / `@SwaggerApiResponseError` 의 상태코드 / 응답 타입 / 에러 코드 목록 변경
- `@UserAuthGuard` / `@UserAuthGuardOptional` / `@AdminAuth` 의 적용·해제·옵션 (`requireAll`/`requireAny`) 변경 (Bearer 마커 / 권한 표기 자동 주입에 영향)
- 새 DTO 클래스 / enum / `ts-jenum` 키 변경으로 swagger 스키마가 달라지는 경우

### 재생성이 불필요한 변경 (영향 X)

- 도메인 service / reader / creator / repository / 비즈니스 로직 변경 (DTO 시그니처에 영향 없는 한)
- 단위 / E2E 테스트 추가·수정
- 리팩터/이름변경이 controller 또는 DTO 의 외부 형태에 영향 없는 경우
- 환경 변수 / config / 모듈 등록 변경

### 운영 흐름

1. controller / DTO / swagger 데코레이터 변경 후 → `pnpm <app> swagger:generate`
2. 생성된 `swagger.json` 의 diff 가 의도한 변경과 일치하는지 빠르게 확인
3. 변경 commit 시 `[Docs] <app> swagger 재생성 (...)` 같은 별도 commit 으로 분리하면 PR 리뷰 시 코드 변경과 산출물 변경을 분리해 볼 수 있어 권장
