---
name: naming-convention
description: 폴더/파일/함수/클래스/생성자 네이밍 규칙. 새 파일·폴더 생성, `*.service.ts`/`*.reader.ts`/`*Req.dto.ts` 등 접미사 결정, admin-api의 `Admin` prefix 적용, `*.manager.ts`·`*.processor.ts` 같은 모호한 책임 네이밍 재검토, `private constructor` + `static of/from` 팩토리 메서드 적용(`new` 키워드 지양) 시 사용. **모든 Request DTO는 `*Req.dto.ts`로 통일** (Body/Query/Param 구분 없이). **enum은 별도 `*.enum.ts` 파일에 분리** (entity 등에 inline type alias 선언 금지).
---

# 네이밍 규칙

## 폴더
- 대문자 사용 안 함. 구분이 필요하면 하이픈(`-`)으로 구분.
- 예시: `user`, `user-token`, `admin-account`, `admin-permission-preset`

## 파일
- 하이픈/언더바 사용 안 함. 단어 구분은 **PascalCase**.
- 책임 지시자(`controller`, `dto`, `service` 등)는 **`.`으로 구분하고 소문자로 시작**.
- 예시: `User.service.ts`, `UserToken.reader.ts`, `CreateUserReq.dto.ts`

### 기본 파일명 패턴

```ts
// Application Layer
*Req.dto.ts        // Request (Body / Query / Path Param 모두 동일)
*Res.dto.ts        // Response (단건 조회는 Detail 접미사 사용 금지)
*.controller.ts

// Domain Layer
*Data.ts           // Input
*Result.ts         // Output
*.service.ts

// Implementation Layer
*.reader.ts        // 조회
*.creator.ts       // 생성
*.updater.ts       // 수정
*.remover.ts       // 삭제
*.verifier.ts      // 검증
*.issuer.ts        // 발행
// ... 필요에 따라 책임이 명확한 접미사 사용

// Database Layer
*.entity.ts
*.repository.ts

// Enum
*.enum.ts          // ts-jenum 패턴 (별도 파일 분리, inline type alias 금지)
```

### Request DTO 파일명 / 클래스명 규칙

- **파일명은 모두 `*Req.dto.ts`로 통일**.
- **클래스명은 의미에 따라 구분**: `*Req`(Body) / `*Query`(Query Param) / `*Param`(Path Param).

```ts
// ✅ Good
// 파일: CreateUserReq.dto.ts
export class CreateUserReq {}     // Body

// 파일: GetUserListReq.dto.ts
export class GetUserListQuery {}  // Query

// 파일: GetUserReq.dto.ts
export class GetUserParam {}      // Path Param

// ❌ Bad — 파일명에 Query/Param
GetUserListQuery.dto.ts
GetUserParam.dto.ts
```

자세한 내용은 `dto-convention` skill 참고.

### Response DTO 단건 조회 네이밍

단건 조회 Response DTO에는 **`Detail` 접미사를 사용하지 않습니다.**

```ts
// ✅ Good
AdminGetAccountRes.dto.ts
AdminGetPresetRes.dto.ts

// ❌ Bad
AdminGetAccountDetailRes.dto.ts
AdminGetPresetDetailRes.dto.ts
```

### Enum 파일 분리

상태값 / 코드 구분 등 **enum 성격을 가진 타입은 반드시 `*.enum.ts` 파일로 분리**합니다. 엔티티/도메인 파일 안에 `type XxxUnion = 'A' | 'B'` 같은 inline type alias를 두지 않습니다.

```ts
// ❌ Bad — entity 파일 내부에 inline 선언
// AdminAccount.entity.ts
export type AdminAccountStatusUnion = 'ACTIVE' | 'SUSPENDED';

// ✅ Good — 별도 enum 파일에 ts-jenum 패턴으로 정의
// apps/admin-api/src/enum/AdminAccountStatus.enum.ts
@Enum('code')
export class AdminAccountStatus extends EnumType<AdminAccountStatus>() {
  static readonly ACTIVE = new AdminAccountStatus('ACTIVE', '활성화');
  static readonly SUSPENDED = new AdminAccountStatus('SUSPENDED', '정지');
  // ...
}
export type AdminAccountStatusUnion = EnumConstNames<typeof AdminAccountStatus>;
export const adminAccountStatusList = AdminAccountStatus.keys();
```

### Implementation Layer 책임 네이밍
- Implement Layer 네이밍은 **책임이 명확**해야 합니다.
- **`*.manager.ts`, `*.processor.ts` 같이 책임이 모호한 네이밍은 지양**합니다. 해당 접미사를 쓰기 전에 다시 한 번 책임을 재정의하세요.

### admin-api 규칙
`admin-api`의 **모든 파일명, 클래스명 앞에는 `Admin` prefix**를 붙입니다.
예: `AdminUser.service.ts`, `AdminCreateUserReq.dto.ts`, `AdminUserController`

### batch 앱 규칙
`apps/batch/src/batch/<domain>/` 하위의 cron handler 는 **`<JobName>.batch.ts`** 접미사 + 클래스명 **`<JobName>Batch`** 로 작성합니다. (예: `UserRefreshTokenCleanup.batch.ts` → `UserRefreshTokenCleanupBatch`)
모든 cron 메서드는 `BatchExceptionHandler.execute('<jobName>', async () => {...})` 으로 감싸 logger / Sentry / Slack notifier 가 자동 호출되도록 합니다.

## 함수
- 함수명은 **camelCase**.
- **화살표 함수(함수 표현식)** 사용 — 호이스팅 영향을 피하기 위함.
- 객체 메서드에서 `this`를 사용해야 하는 경우에만 함수 선언식 허용.

```ts
// Good
const printLog = (log: string | number) => { console.log(log) };

const print = {
  defaultTitle: 'Title',
  warningLog: function(log: string | number) {
    console.log(`${this.defaultTitle} : ${log}`);
  },
};

// Bad
function printLog(log: string | number) {
  console.log(log);
}
```

## 생성자 / static 팩토리 메서드
- `new` 키워드로 외부에서 직접 인스턴스 생성 **금지**.
- `private constructor` + `static of / from*` 팩토리 메서드 사용.
- **예외**: `*Res.dto.ts` (Response DTO)는 Swagger의 `Type<unknown>` 제약 때문에 `public constructor`를 사용합니다.

```ts
// Good
class User {
  private constructor(private readonly name: string) {}

  static of(name: string): User {
    return new User(name);
  }
}
const user = User.of('John');

// Bad
const user = new User('John');
```
