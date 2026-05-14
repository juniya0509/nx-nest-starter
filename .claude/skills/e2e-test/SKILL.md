---
name: e2e-test
description: E2E(End-to-End) 테스트 작성 규칙 + 인프라 가이드. `*.e2e-spec.ts` 작성 시 사용. **testcontainers MySQL** 로 실제 DB 띄우고 **supertest** 로 HTTP 호출하며 **시드 admin + 실 JWT 발급** 으로 가드 통합 검증. unit-test 가 커버하지 않는 **Controller / Repository / AdminAuthGuard 권한 분기 / DB SQL 의미** 를 모두 이 레이어에서 잡는다. 실행: `pnpm admin test:e2e` / `pnpm core test:e2e` / `pnpm batch test:e2e`. 위치: `apps/<app>/e2e-test/`. 헬퍼: `AdminTestApp.factory.ts` / `CoreTestApp.factory.ts`, `AdminAuthFixture.ts` / `CoreAuthFixture.ts`. batch 앱은 cron 단위 검증으로 충분한 경우 e2e 가 placeholder 일 수 있다 (DB 통합 검증이 필요해지면 testcontainers + globalSetup 추가).
---

# E2E 테스트 규칙

## 테스트 대상

unit-test 로 커버되지 않는 통합 동작 — 실제 HTTP 요청 → 가드/파이프 → 컨트롤러 → 도메인 → 실 MySQL 쿼리까지 한 사이클을 검증.

| 검증 항목 | 단위테스트 못 잡는 부분 |
| - | - |
| `@AdminAuth` 가드 권한 분기 | 401(Bearer 없음) / 403(권한 부족) / 200(권한 있음) |
| `class-validator` 파이프 검증 | DTO `@IsInt`, `@Min`, `@IsIn` 등 실제 적용 |
| Repository QueryBuilder SQL | 키워드 LIKE / status 필터 / 페이징 offset 의 실제 결과 |
| `class-transformer` 직렬화 | `@Expose`/`@Exclude` 적용된 응답 형태 |
| Response DTO 필드 누락 회귀 | `_isAdmin` 같은 필드 빠뜨림 catch |
| TypeORM 트랜잭션·관계 매핑 | 실제 DB 동작 |

## 디렉토리 구조

```
apps/admin-api/e2e-test/
├── jest.config.cts                  # E2E 전용 jest config (폴더명이 단위 jest.config.cts 와 disambiguate)
├── tsconfig.json                    # E2E 전용 TS config
├── support/                         # 인프라 (테스트 도메인과 분리)
│   ├── setup/
│   │   ├── AdminTestEnv.ts          # 비-DB env stub (Joi 통과용)
│   │   ├── AdminE2eContainerHolder.ts  # 컨테이너 핸들 모듈-스코프 보관
│   │   ├── AdminE2eGlobalSetup.ts   # globalSetup: 컨테이너 기동 + env 주입
│   │   └── AdminE2eGlobalTeardown.ts # globalTeardown: 컨테이너 정리
│   └── helper/
│       ├── AdminTestApp.factory.ts  # Nest app 부팅 (main.ts 와 동일 파이프/필터)
│       └── AdminAuthFixture.ts      # 시드(user/admin/permission) + JWT 발급
└── domain/                          # 도메인별 spec (src/domain/ 과 동일 구분)
    └── <도메인>/
        └── *.e2e-spec.ts            # 실제 테스트
```

E2E spec 파일은 항상 **`apps/<app>/e2e-test/domain/<도메인>/<X>.e2e-spec.ts`**. `src/` 안에 두면 prod 빌드 영향 위험.

폴더 의미:
- `support/setup/` — jest 의 `globalSetup` / `globalTeardown` 훅에서 호출되는 인프라 (컨테이너 라이프사이클, env 주입)
- `support/helper/` — spec 본문에서 `import` 해서 쓰는 헬퍼 (App 부팅, 시드, JWT 발급)
- `domain/<도메인>/` — 실제 테스트 케이스 (`src/domain/` 과 매칭)

## 인프라 동작 원리

1. **globalSetup** (jest 메인 프로세스)
   - `AdminTestEnv` 가 Joi 스키마를 만족시키는 stub env 주입 (Twilio·Lokalise·Firebase·AWS 등)
   - `MySqlContainer('mysql:8.0').start()` 로 컨테이너 기동
   - `MYSQL_DB_*` env 를 컨테이너 정보로 갱신
   - 컨테이너 핸들을 `globalThis.__ADMIN_E2E_MYSQL__` 에 저장
2. **워커 프로세스** 가 spawn 시 위 env 를 상속 → `AdminApiAppModule` 부팅 시 `synchronize: true` 로 스키마 자동 생성 (NODE_ENV=test 라 production/script 가 아니므로)
3. **각 spec** 은 `createAdminTestApp()` 으로 Nest app 띄우고 `supertest(app.getHttpServer())` 로 HTTP 호출
4. **globalTeardown** 이 컨테이너 stop

## 실행

워크스페이스 루트의 alias 스크립트(`admin` = `pnpm -F @nx-nest-starter/admin-api`, `core` = `pnpm -F @nx-nest-starter/core-api`, `batch` = `pnpm -F @nx-nest-starter/batch`)를 통해:

```bash
# admin-api
pnpm admin test:e2e            # E2E 만
pnpm admin test                # 단위 + e2e 순차 실행 (단위 실패 시 e2e 안 감)

# core-api
pnpm core test:e2e             # E2E 만
pnpm core test                 # 단위 + e2e 순차 실행

# batch
pnpm batch test:e2e            # E2E 만 (현재는 placeholder — DB 통합 검증 필요해지면 testcontainers + globalSetup 추가)
pnpm batch test                # 단위 + e2e 순차 실행
```

**선행 조건**: 도커 데몬 실행 중. `docker info` 로 확인. 첫 부팅 ~5–10초, 이후 컨테이너 재사용 시 spec 자체는 ~1–2초.

## 작성 의무

새 컨트롤러/엔드포인트/권한 분기 추가 시 **해당 도메인의 e2e-spec 을 함께 작성·갱신**합니다. 자세한 정책은 `build-verification` skill 의 "1단계: 테스트" 참고.

## 작성 패턴

### 기본 골격

```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AdminPermission } from '../../../src/enum/AdminPermission.enum';
import { AdminAuthFixture } from '../../support/helper/AdminAuthFixture';
import { createAdminTestApp } from '../../support/helper/AdminTestApp.factory';

describe('Admin User (E2E)', () => {
  let app: INestApplication;
  let fixture: AdminAuthFixture;

  beforeAll(async () => {
    app = await createAdminTestApp();
    fixture = AdminAuthFixture.of(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await fixture.clearAll();
  });

  // ... it()
});
```

### 권한 분기 검증 (가장 중요)

```ts
it('USER_LIST 권한 없으면 403', async () => {
  const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_READ]);
  await request(app.getHttpServer()).get('/v1/users').set('Authorization', `Bearer ${accessJwt}`).expect(403);
});

it('USER_LIST 권한 있으면 200', async () => {
  const { accessJwt } = await fixture.seedAdminWithPermissions([AdminPermission.USER_LIST]);
  await request(app.getHttpServer()).get('/v1/users').set('Authorization', `Bearer ${accessJwt}`).expect(200);
});
```

각 권한 가드 분기(`requireAll`, `requireAny`)마다 **권한 있음 / 없음** 두 케이스는 의무.

### 데이터 시드

- `fixture.seedUser(overrides?)` — 일반 유저
- `fixture.seedAdminWithPermissions([...])` — admin_account + permission(없으면 자동 생성) + 실제 JWT 발급
- 시드 안에서 이메일은 `Date.now() + Math.random()` 으로 자동 유니크 처리
- 매 `it` 직전 `clearAll()` 로 모든 admin/user 테이블 `DELETE` + AUTO_INCREMENT 리셋

### 응답 본문 검증

- 응답은 `{ data: { ... } }` 래퍼 형식 (`AdminApiResponse.successWithData`)
- 페이지네이션 응답은 `data.totalResults`, `data.totalPages`, `data.list`

## 안티패턴

- ❌ `.overrideGuard()` 로 `AdminAuthGuard` 우회 → 권한 분기 검증 가치 소실. 시드 + 실 JWT 사용.
- ❌ spec 마다 컨테이너 재기동 → 비용 폭증. globalSetup 한 번만.
- ❌ `clearAll()` 안 부르고 다음 spec 진행 → 이전 데이터 누적으로 flaky.
- ❌ Repository 단위 mock 으로 같은 검증 시도 → SQL 의미 못 잡음, E2E 로 와야 함.
- ❌ `AdminAuthFixture` 안에서 직접 DB 쿼리하지 않고 운영 코드의 Reader/Service 호출 → 시드는 단순/직접이 정답. 운영 코드 의존하면 운영 버그가 시드 자체를 막음.

## 인프라 변경 시 주의

- **새 외부 의존성 (예: Redis, Kafka)** 추가 시 같은 패턴으로 별도 testcontainer 추가, globalSetup 에서 함께 기동.
- **Joi 스키마에 새 env 변수** 추가했으면 `AdminTestEnv.ts` 의 stub 도 업데이트.
- **새 엔티티** 추가 후 테스트가 `Cannot find table` 류 에러 → `AdminTypeOrm.config.ts` 의 entities 배열에 추가됐는지 확인 (테스트도 같은 config 로 부팅).
- **`AdminAuthFixture.clearAll()` 의 테이블 목록** — admin/user 도메인에 새 junction 테이블 추가 시 같이 등록.

## 권장 커버리지

도메인당 다음 셋을 기본 패턴으로:

| 카테고리 | 케이스 |
| - | - |
| 인증 실패 | `Authorization` 헤더 없음 → 401 |
| 권한 실패 | 다른 권한만 있는 admin 으로 호출 → 403 |
| 정상 경로 | 권한 있는 admin + 시드 데이터 → 200 + 응답 형태 검증 |
| 필터/쿼리 | 각 query 파라미터마다 1케이스 (keyword·status·페이징) |
| 예외 분기 | 404 / 409 등 도메인 예외 |
