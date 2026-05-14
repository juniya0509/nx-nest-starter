---
name: build-verification
description: 구현 완료 직전 실행하는 최종 통합 검증 (테스트 → 빌드 → 린트). **순서: ① unit + e2e 테스트 통과 → ② `nx build` warning/error 0 → ③ `nx run-many --target=lint` warning/error 0**. 테스트 실패 상태로 빌드 단계로 넘어가지 않으며, 테스트를 의도적으로 약화시켜 통과시키는 것은 금지. lint 결과는 SUCCESS 라인이 아니라 출력 전체에서 `warning`/`error`/`problem` 키워드를 검색해 검증. `--skip-nx-cache` 필수.
---

# 완료 전 통합 검증 (테스트 → 빌드 → 린트)

구현이 끝난 **마지막 단계**에서 다음 순서로 검증합니다. **셋 다 통과해야 완료로 인정**합니다.

```
① 테스트 (unit + e2e)  ─┐
                          │  하나라도 실패하면 다음 단계로 넘어가지 않는다
② nx build              ─┤
                          │
③ nx lint               ─┘
```

## 1단계: 테스트 (필수, 가장 먼저)

### 실행
```bash
# admin-api
pnpm admin test            # = test:unit && test:e2e
pnpm admin test:unit
pnpm admin test:e2e

# core-api
pnpm core test
pnpm core test:unit
pnpm core test:e2e

# batch
pnpm batch test
pnpm batch test:unit
pnpm batch test:e2e
```

`admin` / `core` / `batch` 는 워크스페이스 루트 `package.json` 의 alias 스크립트.

### 통과 기준
- **모든 spec 통과**, 0 failure / 0 skipped(의도적 skip 제외)
- jest 출력 마지막 `Tests: X passed, X total` 확인

### ⚠️ 금지 사항
**기능 버그가 분명한데 테스트 통과를 위해 테스트 코드를 약화하는 것은 금지**합니다. 다음은 모두 금지:
- 실패하는 `expect` 를 `toBe` 에서 `not.toBe` 로 뒤집기
- `it.skip` / `it.todo` 로 회피
- 검증 대상을 더 느슨한 매처(`expect.anything()` 등)로 바꾸기
- spec 자체를 삭제

테스트가 실패하면 **테스트가 알려주는 코드의 문제를 고친다.** 테스트가 잘못된 경우(요구사항 변경, 잘못된 매처)에만 spec 을 수정하며, 그 이유를 PR 설명/커밋 메시지에 명시합니다.

### 작성 의무
- 기능 추가/수정 시 **해당 도메인의 unit + e2e 테스트 작성·갱신 필수**
- 작성 범위: `unit-test` skill (Service/Implement 만), `e2e-test` skill (Controller/Repository/가드)
- 새 spec 없이 기능만 머지하면 완료 아님

## 2단계: 빌드

### 캐시 초기화 + 빌드
```bash
pnpm nx clear-cache
pnpm nx build admin-api --skip-nx-cache    # 또는 core-api / batch / 전체 run-many
```

`--skip-nx-cache` 는 캐시된 통과 결과로 검증이 스킵되는 것을 막기 위해 필수입니다.

### 통과 기준
- 빌드 에러 0개
- 빌드 warning 0개

## 3단계: 린트

### 실행
```bash
# 단일 앱
pnpm nx run-many --target=lint --projects=admin-api,core-domain,core-enum,core-database,core-contract,core-util --skip-nx-cache

# 전체
pnpm nx run-many --target=lint --projects=core-api,admin-api,batch,core-domain,core-enum,core-database,core-contract,core-util --skip-nx-cache
```

### ⚠️ 출력 검증 방법

`pnpm nx lint` / `pnpm nx build` 는 **warning 이 있어도 task 자체는 SUCCESS 로 끝납니다**. 마지막 줄(`NX Successfully ran target ...`) 만 보고 통과로 판단하면 warning 을 놓칩니다.

**반드시 출력 전체에서 `warning` / `error` / `problem` / `✖` 키워드를 검색**해 0개임을 확인:

```bash
# ❌ 잘못된 검증
pnpm nx lint admin-api 2>&1 | tail -3

# ✅ 올바른 검증
pnpm nx lint admin-api --skip-nx-cache 2>&1 | grep -E "warning|error|problem|✖"
# → 출력 비어있으면 통과
```

자동 수정 가능 항목은 먼저 `eslint --fix` 시도:
```bash
npx eslint --fix <file>
```

## 통과 기준 (전체)

| 단계 | 기준 |
| - | - |
| ① 테스트 | unit + e2e 모두 0 failure |
| ② 빌드 | 에러 0 + warning 0 (출력 grep 빈 결과) |
| ③ 린트 | 에러/warning 0 (출력 grep 빈 결과) |

하나라도 미달이면 **완료가 아니며**, 원인 해결 → 처음부터 재실행.

## 자주 놓치는 케이스

- **테스트 단계 스킵** — 빌드/린트만 확인하고 끝내기 쉬움. 테스트가 첫 단계.
- **prettier/prettier warning** — 줄 길이가 변하면 줄바꿈 상태가 prettier 규칙과 어긋날 수 있음. `eslint --fix` 로 해결.
- **unused import** — 식별자를 제거했는데 import 만 남은 경우. grep 으로 확인.
- **nx 캐시** — 이전 통과 결과가 캐시되어 실제 검증이 스킵될 수 있음. 항상 `--skip-nx-cache`.
- **e2e 컨테이너 실패** — 도커 미실행. `docker info` 로 확인.
