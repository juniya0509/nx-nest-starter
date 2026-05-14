---
name: package-installation
description: 패키지 설치 위치(루트 vs `apps/core-api` vs `apps/admin-api` vs `apps/batch`)와 의존성 종류(`dependencies` vs `devDependencies`) 결정 규칙. `pnpm add` 실행·`package.json` 수정·새 라이브러리 도입 시 사용. 단일 앱 전용이면 해당 앱에, 여러 앱 공용은 **동일 버전일 때만** pnpm catalog 또는 루트에 설치.
---

# 패키지 설치 규칙

## 설치 위치 결정 트리

| 상황 | 설치 위치 |
| - | - |
| `core-api`에서만 사용 | `apps/core-api/package.json` |
| `admin-api`에서만 사용 | `apps/admin-api/package.json` |
| `batch`에서만 사용 | `apps/batch/package.json` |
| 여러 앱 사용 + **버전이 다름** | 각 앱에 **별도 설치** |
| 여러 앱 사용 + **동일 버전** | **pnpm catalog** (`pnpm-workspace.yaml`) 등록 + 각 앱 `package.json` 에서 `"catalog:"` 참조 |

## 의존성 종류 (`dependencies` vs `devDependencies`)

- **runtime 코드에서 `import`** → `dependencies`
  - 예: `@nestjs/common`, `typeorm`, `dayjs`, `class-validator`
- **빌드/린트/테스트/타입 정의 전용** → `devDependencies`
  - 예: `jest`, `@types/*`, `eslint`, `@nx/*`(빌드 도구), `typescript`, `ts-node`

## 설치 전 체크 포인트

1. **단일 앱 전용인지 먼저 판단** — 한 앱에서만 `import`할 패키지인가?
  - 예 → 해당 앱에 설치 (루트 설치 금지)
2. **두 앱 공용이면 버전 합의가 가능한지** 확인.
  - 같은 버전으로 통일 가능 → 루트 설치
  - 앱별로 다른 버전이 필요 → 각 앱에 별도 설치
3. **runtime vs 개발 전용** 구분 — `dependencies` / `devDependencies` 중 맞는 쪽에 넣기.

## 금지 패턴

- ❌ 한 앱에서만 쓰는 패키지를 **루트에 설치** — 다른 앱 번들에 불필요한 의존성이 섞입니다.
- ❌ 동일 버전의 같은 패키지를 **양쪽 앱에 중복 설치** — 루트로 올려 중복 제거.
- ❌ 개발 전용 도구(타입 정의, 테스트 러너 등)를 `dependencies`에 등록.

## 설치 후 확인

- 의도한 `package.json`에 엔트리가 추가됐는지 확인.
- `pnpm-lock.yaml`이 올바르게 갱신됐는지 확인.
- 빌드/린트 실행해 해당 앱에서 import가 정상 해석되는지 확인 (`build-verification` skill 참고).

> 여러 패키지를 catalog 에 일괄 추가하거나 기존 catalog 항목을 다른 앱에도 적용하는 자동화는 `catalog-add` skill 활용. `pnpm catalog:add` 스크립트로 catalog 자기 참조 같은 함정도 자동 회피.
