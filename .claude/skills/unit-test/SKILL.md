---
name: unit-test
description: Unit 테스트 작성 범위와 패턴. `*.spec.ts` 작성 시 사용. **Service / Implement Layer(Reader/Creator/Updater/Deleter) + Batch cron handler 만 단위테스트 대상**이며, **DTO / Data / Result / Repository / Controller 는 단위테스트하지 않는다** (Repository·Controller 는 E2E 에서 커버, DTO·Data·Result 는 framework·언어 동작 검증으로 흘러 신호가 낮음). NestJS `Test.createTestingModule` + `useValue` mock 패턴, `tsconfig.spec.json` paths override 금지, jest `moduleNameMapper` 동기화 규칙 포함.
---

# Unit 테스트 규칙

## 테스트 대상

### ✅ 작성

| 레이어 | 클래스 | 검증 항목 |
| - | - | - |
| Application | **Service** (`*.service.ts`) | Reader/Creator 등 위임 호출 + 인자 전달 + 트랜잭션 경계가 있는 경우 흐름 |
| Implement | **Reader / Creator / Updater / Deleter** (`*.reader.ts` 등) | 비즈니스 로직, 분기, 예외 throw, repo 인자 전달 |
| Batch | **Cron handler** (`*.batch.ts`) | `@Cron` 으로 등록된 메서드를 직접 호출하여 위임/예외 처리 검증. cron 시각 자체는 검증 X (라이브러리 책임). |

### ❌ 작성하지 않음

| 클래스 | 이유 |
| - | - |
| **DTO** (`*Req.dto.ts` / `*Res.dto.ts`) | 단순 필드 + `class-validator` / `class-transformer` 데코레이터 위주. 단위테스트가 framework 동작 검증으로 흘러 신호가 낮음. Request 의 `to*Data()` 매핑이나 Response 의 필드 누락 같은 회귀는 **컨트롤러 E2E** 에서 자연스럽게 커버됨. |
| **Data** (`*Data.ts`) | `static of()` 팩토리 + `get` 게터만 있는 value-object. 테스트가 언어/RORO 패턴 동작 검증이 되어 가치 낮음. |
| **Result** (`*Result.ts`) | Data 와 동일. 파생 게터(예: `fullname`)가 있더라도 그 결과는 **Reader/Service spec 의 `expect(result.fullname).toBe(...)` 로 자연스럽게 검증**되므로 별도 spec 은 중복. |
| **Repository** (`*.repository.ts`) | TypeORM QueryBuilder / Brackets / 페이징 의 핵심은 실제 SQL 의미. mock 으로는 "메서드가 호출됐다" 정도만 확인 가능해 SQL 버그를 못 잡음. **E2E (testcontainers + 실제 DB)** 에서 커버. |
| **Controller** (`*.controller.ts`) | 가드 / 파이프 / 인터셉터 / 검증 통합 동작이 핵심. **E2E** 에서 커버. |

> 위 ❌ 항목은 **단위테스트만 안 한다**는 의미이고, E2E 에서는 모두 커버 대상.

## 위치 / 명명

- 소스 파일과 **같은 디렉토리** 에 `<원본파일명>.spec.ts` 로 배치.
  - `apps/admin-api/src/domain/admin-user/AdminUser.reader.ts` → `apps/admin-api/src/domain/admin-user/AdminUser.reader.spec.ts`
- `describe(클래스명)` 1개, `describe(메서드명)` 으로 그룹.

## 작성 패턴

### NestJS `Test.createTestingModule` + `useValue` mock

```ts
import { Test, TestingModule } from '@nestjs/testing';

describe('AdminUserReader', () => {
  let reader: AdminUserReader;
  let adminUserRepository: jest.Mocked<Pick<AdminUserRepository, 'findById' | 'findListWithPagination'>>;
  let adminAccountRepository: jest.Mocked<Pick<AdminAccountRepository, 'findByUserId'>>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserReader,
        { provide: AdminUserRepository, useValue: { findById: jest.fn(), findListWithPagination: jest.fn() } },
        { provide: AdminAccountRepository, useValue: { findByUserId: jest.fn() } },
      ],
    }).compile();

    reader = moduleRef.get(AdminUserReader);
    adminUserRepository = moduleRef.get(AdminUserRepository);
    adminAccountRepository = moduleRef.get(AdminAccountRepository);
  });
});
```

### Mock 타입은 좁혀서 사용

- `jest.Mocked<Pick<RepoType, '사용하는메서드'>>` 형태로 좁힘 → 미사용 메서드 mock 누락이 타입에서 잡힘.

### Entity mock

- 필요한 필드만 채우고 `as unknown as Entity` cast.

```ts
const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
  ({
    id: 1,
    email: 'user@example.com',
    firstname: 'John',
    lastname: 'Doe',
    status: 'ACTIVE',
    ...overrides,
  }) as unknown as UserEntity;
```

### 검증 케이스 가이드

Reader / Service 테스트는 최소 다음 셋을 커버:

1. **정상 경로** — 입력 → 결과 매핑 (필드 단위 또는 파생 값)
2. **예외 분기** — `NotFoundException(errorType: ...)` 등을 `toMatchObject({ constructor: NotFoundException, response: { errorType: ... } })` 로 검증
3. **위임 / 인자 전달** — `expect(repo.findById).toHaveBeenCalledWith(id)` 등으로 의존성 호출 인자 확인

## 실행

워크스페이스 루트의 alias 스크립트(`admin` = `pnpm -F @nx-nest-starter/admin-api`, `core` = `pnpm -F @nx-nest-starter/core-api`, `batch` = `pnpm -F @nx-nest-starter/batch`)를 통해:

```bash
# admin-api
pnpm admin test:unit           # 단위 테스트만 (admin-api + core-domain)
pnpm admin test                # 단위 + e2e 순차 실행

# core-api
pnpm core test:unit            # 단위 테스트만 (core-api + core-domain)
pnpm core test                 # 단위 + e2e 순차 실행

# batch
pnpm batch test:unit           # 단위 테스트만 (batch + core-domain)
pnpm batch test                # 단위 + e2e 순차 실행

# 단일 nx 프로젝트만 빠르게 (jest watch 등)
pnpm nx test admin-api --watch
pnpm nx test core-domain --coverage
```

내부 동작: `test:unit` 은 `nx run-many --target=test --projects=<app>,core-domain` 으로 도메인 라이브러리(`core-domain`)의 spec 도 함께 실행. spec 이 추가된 lib 가 더 생기면 해당 앱의 `package.json` `test:unit` 스크립트의 `--projects=...` 목록에 추가.

`build-verification` 에서 lint/build 와 함께 통과시켜야 완료로 인정.

## 작성 의무

기능 추가/수정 시 해당 도메인의 Service/Implement 레이어 spec 을 **함께 작성·갱신**합니다. 자세한 정책은 `build-verification` skill 의 "1단계: 테스트" 참고.

## 인프라 / 설정 주의

### `tsconfig.spec.json` 의 `paths` override 금지

- `paths` 를 자식 tsconfig 에서 재정의하면 **부모 paths 가 완전히 대체**되며, 이때 `baseUrl` 은 부모(base) 기준으로 유지된다. 자식에서 상대경로(`../../libs/...`)로 적으면 base 의 `baseUrl: "."`(=root) 기준으로 해석되어 root 보다 위로 올라간다.
- 따라서 spec 의 `paths` 를 비워 base 의 매핑(`@libs/*` 포함)을 그대로 상속한다.

```jsonc
// apps/<app>/tsconfig.spec.json — paths 정의 자체를 두지 않는다
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./out-tsc/jest",
    "types": ["jest", "node"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["jest.config.cts", "src/**/*.spec.ts", "src/**/*.test.ts", "src/**/*.d.ts"],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

### `jest.config.cts` 의 `moduleNameMapper` 동기화

jest 는 tsconfig paths 를 자동 인식하지 않으므로 `pathsToModuleNameMapper` 로 base tsconfig 와 동기화:

```ts
const { readFileSync } = require('fs');
const { pathsToModuleNameMapper } = require('ts-jest');

const { compilerOptions } = JSON.parse(readFileSync(`${__dirname}/../../tsconfig.base.json`, 'utf-8'));

module.exports = {
  // ...
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../' }),
};
```

## 안티패턴

- ❌ DTO / Data / Result / Repository / Controller 단위테스트 추가 (위 표 참고)
- ❌ `expect.any` 남발 — 실제 값으로 검증해야 회귀를 잡음
- ❌ private 메서드를 `(reader as any)` 로 직접 호출하여 테스트 — public API 통해서만 검증
- ❌ 한 `it` 안에서 여러 분기 검증 — 분기마다 `it` 하나
- ❌ `tsconfig.spec.json` 에 `paths` 재정의 (위 "인프라 주의" 참고)
