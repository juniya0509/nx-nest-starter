# Nx Nest Starter

> Nx · NestJS · pnpm · TypeORM 기반의 **백엔드 모노레포 보일러플레이트**.
> 사용자 API + 관리자 API + 배치 (cron) 까지 세 가지 애플리케이션을 하나의 워크스페이스에서 운영하며, GitHub Actions + AWS (ECR / CodeDeploy / EC2) 로 자동 CD 가 연결되어 있다.

---

## 핵심 특징

### 코드
- **Layered Architecture** — Application → Domain → Implementation → Database 단방향 참조
- **모노레포** — `apps/` (3개) + `libs/` (5개 공유 lib) — pnpm catalog + workspace
- **NestJS 11** + TypeORM (MySQL 8) + Joi env validation
- **국제화 (i18n)** — Lokalise + `nestjs-i18n`, 7개 언어 (ko/en-US/ja/de/es/fr/ms)
- **인증** — JWT + Logto OAuth + 다국가 SMS/Push/Mail
- **에러 / 모니터링** — `ApiResponse` 통일 포맷, 앱별 에러 코드 상수, Sentry + Slack notifier

### 운영
- **CI/CD** — GitHub Actions + AWS CodeDeploy. `nx affected` 기반으로 **변경된 앱만 재배포**
- **무중단 배포** — admin/core 는 ALB Blue/Green (single-TG 패턴), batch 는 In-place
- **12-factor** — 동일 Docker image 를 dev/prod 에 promote, 차이는 런타임 `.env` 만
- **인증** — GitHub OIDC + AWS IAM Role (long-lived key 없음)

### DX
- **`pnpm dev`** 한 줄로 3개 앱 동시 watch 모드 실행
- **Swagger 자동 생성** — `pnpm <app> swagger:generate` 로 `swagger.json` 갱신
- **`.claude/`** 의 skill / docs — IDE/AI 작업 시 컨벤션 자동 적용

---

## 기술 스택

| 분야 | 도구 |
| - | - |
| 언어 | TypeScript 5.9 |
| 런타임 | Node 22.14 |
| 패키지 매니저 | **pnpm 10.33** (catalog 사용) |
| 모노레포 | **Nx 22.6** |
| 프레임워크 | **NestJS 11** |
| ORM / DB | TypeORM 0.3 / MySQL 8 |
| 빌드 | `@nx/js:swc` (multi-stage Dockerfile) |
| 테스트 | Jest + supertest + testcontainers |
| 인증 | `@nestjs/jwt` + `@logto/node` (OAuth) |
| 국제화 | `nestjs-i18n` + Lokalise (CI/로컬에서 download) |
| 메일 | AWS SES |
| Push | Firebase Admin SDK |
| 모니터링 | Sentry + Slack webhook |
| CI/CD | GitHub Actions + AWS (ECR / S3 / CodeDeploy / EC2 / ALB / ASG) |

---

## 디렉터리 구조

```
nx-nest-starter/
├── apps/                                # NX 애플리케이션
│   ├── admin-api/                       # 어드민 API (Admin prefix, 권한 기반)
│   ├── core-api/                        # 공용 API (사용자 인증, OAuth)
│   └── batch/                           # cron 기반 배치 (단일 EC2, ALB 없음)
├── libs/                                # 공유 라이브러리 (5개)
│   ├── core-contract/                   # 외부 서비스 계약 (push/sms/mail)
│   ├── core-database/                   # TypeORM 엔티티 + Repository (Database Layer)
│   ├── core-domain/                     # Service / Reader / Creator ... (Domain + Implementation)
│   ├── core-enum/                       # 도메인 enum / 상수
│   └── core-util/                       # 도메인 무관 유틸
├── .github/workflows/                   # CI/CD pipelines
│   ├── pr-check.yml                     # PR → develop (CI only)
│   ├── pipeline-develop.yml             # push develop (CI + CD to dev)
│   ├── pipeline-master.yml              # push master (CI + CD to prod)
│   └── deploy-app.yml                   # (reusable) Docker build + ECR + CodeDeploy
├── .claude/
│   ├── docs/                            # 아키텍처 / CD / 셋업 / 스크립트 가이드
│   └── skills/                          # 작업 시점 자동 적용 컨벤션 (17개)
├── scripts/                             # dev-all.sh, encoding-env.mjs, catalog-add.mjs
├── Dockerfile                           # 루트 단일 Dockerfile (APP_NAME build-arg)
├── pnpm-workspace.yaml                  # catalog 정의
├── nx.json
└── CLAUDE.md                            # AI assistant 작업 가이드 (사람도 참고 OK)
```

---

## 빠른 시작 (로컬)

### 요구사항
- Node **22.14.0** (이상 권장 안 함 — `.nvmrc` 또는 `engines` 명시)
- pnpm **10.33.1** (`corepack enable` 로 설치)
- Docker (테스트의 testcontainers 가 사용)
- MySQL 8.x (로컬 DB)

### 1. 의존성 설치

```bash
git clone <repo>
cd nx-nest-starter
corepack enable                    # pnpm 활성
pnpm install
```

### 2. 환경 변수 작성

각 앱마다 `.env.example` 을 복사해 `.env.local` 작성:

```bash
cp apps/admin-api/.env.example apps/admin-api/.env.local
cp apps/core-api/.env.example apps/core-api/.env.local
cp apps/batch/.env.example apps/batch/.env.local
# 각 파일의 값을 채움 (DB 연결, JWT secret, AWS / Firebase / Lokalise 토큰 등)
```

> `SERVER_PORT` 는 admin/core 는 `3000`, batch 는 `3001` 사용 — Docker 배포 컨벤션과 일치

### 3. i18n 번역 다운로드 (admin/core)

Lokalise 에서 번역 zip 받아 `src/i18n/locale/` 에 추출:

```bash
pnpm admin i18n:download
pnpm core i18n:download
```

### 4. 개발 서버 실행

```bash
pnpm dev                           # admin + core + batch 동시 실행 (watch)
```

또는 개별:

```bash
pnpm admin start:dev:local         # admin-api 만, port 3000, inspect 9230
pnpm core start:dev:local          # core-api 만, port 3000, inspect 9229
pnpm batch start:dev:local         # batch 만, inspect 9231
```

---

## 주요 명령어 (치트시트)

| 카테고리 | 명령 | 설명 |
| - | - | - |
| 개발 | `pnpm dev` | 3개 앱 동시 watch |
| 개발 | `pnpm <app> start:dev:local` | 단일 앱 watch |
| 빌드 | `pnpm <app> build:production` | nx swc 빌드 |
| 테스트 | `pnpm <app> test:unit` | Service / Implement / Batch cron unit |
| 테스트 | `pnpm <app> test:e2e` | testcontainers MySQL + supertest |
| 린트 | `pnpm <app> lint` | 해당 앱 + 의존 lib lint |
| i18n | `pnpm <app> i18n:download` | Lokalise → locale/ |
| Swagger | `pnpm <app> swagger:generate` | swagger.json 갱신 |
| 패키지 | `pnpm catalog:add` | pnpm catalog 에 패키지 추가 (인터랙티브) |
| 배포 | `pnpm encoding-env-base64` | `.env` 를 GitHub Secret 용 base64 로 (인터랙티브) |

`<app>` = `admin` | `core` | `batch` (루트의 alias)

상세는 [.claude/docs/SCRIPTS.md](.claude/docs/SCRIPTS.md) 참고.

---

## 아키텍처

```
┌─────────────────────────────────────────────┐
│              Application Layer              │  ← Controller, Request/Response DTO
├─────────────────────────────────────────────┤
│              Domain Layer                   │  ← Business Logic (*.service.ts)
├─────────────────────────────────────────────┤
│           Implementation Layer              │  ← *.reader.ts, *.creator.ts, *.updater.ts ...
├─────────────────────────────────────────────┤
│              Database Layer                 │  ← Entity, Repository
└─────────────────────────────────────────────┘
```

- 위 → 아래 **단방향 참조**만 허용
- Implementation Layer 안에서만 서로 참조 가능 (재사용성)
- `batch` 앱은 예외적으로 Database Layer (Repository) 직접 호출 허용 (대량 정리/집계)

상세는 [.claude/docs/ARCHITECTURE.md](.claude/docs/ARCHITECTURE.md) 참고.

---

## 테스트

| 종류 | 대상 | 도구 | 실행 |
| - | - | - | - |
| Unit | Service / Implement (Reader/Creator/Updater/Deleter) / Batch cron handler | NestJS Test + jest mock | `pnpm <app> test:unit` |
| E2E | Controller / Repository / Guard 권한 분기 / SQL 의미 | testcontainers MySQL + supertest + 실 JWT | `pnpm <app> test:e2e` |

> DTO / Data / Result / Repository / Controller 는 **unit test 대상 아님** — Repository/Controller 는 E2E 에서 커버, DTO/Data/Result 는 framework 동작 검증으로 흘러 신호가 낮음.

---

## CI/CD

### Workflow

| 트리거 | Workflow | 동작 |
| - | - | - |
| PR → develop | `pr-check.yml` | CI only — `nx affected` 기반 lint/test/build/e2e |
| push → develop | `pipeline-develop.yml` | CI 전체 + CD to **development** (변경된 앱만) |
| PR / push → master | `pipeline-master.yml` | CI 전체 + (push 시) CD to **production** (변경된 앱만) |

### 배포 흐름

```
GitHub push
  ↓
ci job (lint/test/build/e2e + nx affected 계산)
  ↓
deploy-<app> jobs (affected = true 인 앱만)
  ├── Docker image build (multi-stage)
  ├── ECR push (tag = git SHA)
  ├── CodeDeploy bundle → S3
  └── aws deploy create-deployment
        ↓
        EC2 ASG (Blue/Green: admin/core, In-place: batch)
        ↓
        docker compose up → /v1/health 200 → ALB traffic shift
```

- **`nx affected`** 가 변경된 lib 의 dependency graph 를 따라 의존하는 앱 모두 자동 추출
- **Blue/Green single-TG** — listener swap 없이 target group 의 register/deregister 로 점진 shift
- 상세 흐름 / 패턴 / 트레이드오프: [.claude/docs/CD.md](.claude/docs/CD.md)
- AWS / GitHub 인프라 셋업 단계별 가이드: [.claude/docs/INFRA_SETUP.md](.claude/docs/INFRA_SETUP.md)

---

## 컨벤션 / 규칙

`.claude/` 에 두 종류 자료가 있다:

### `.claude/docs/` (참조 문서)
- [`ARCHITECTURE.md`](.claude/docs/ARCHITECTURE.md) — 레이어 / 의존성 규칙
- [`SCRIPTS.md`](.claude/docs/SCRIPTS.md) — 모든 스크립트의 실행 위치 / NODE_ENV / .env 매핑
- [`CD.md`](.claude/docs/CD.md) — CD 동작 원리 / 패턴 / 향후 개선 / 트러블슈팅
- [`INFRA_SETUP.md`](.claude/docs/INFRA_SETUP.md) — GitHub + AWS 셋업 단계별 가이드 (zero state → 첫 배포)
- [`PRD.md`](.claude/docs/PRD.md) — 제품 요구사항

### `.claude/skills/` (작업 시점 자동 적용 컨벤션, 17개)

작업 시 IDE/AI 가 자동 매칭해 컨벤션을 적용. 사람이 직접 읽을 때는 reference 로 활용.

| skill | 적용 시점 |
| - | - |
| `naming-convention` | 새 파일/폴더/함수/클래스 네이밍 |
| `dto-convention` | Application Layer Request/Response DTO 작성 |
| `data-result-convention` | Domain/Implementation 의 Data/Result 클래스 작성 |
| `typeorm-entity` | Entity / Repository / Column 정의 |
| `error-handling` | 앱별 에러 상수 사용, Exception throw |
| `import-convention` | import 경로 결정 (상대 / `@admin-api` / `@libs/...`) |
| `swagger-api` | Controller 의 Swagger 데코레이터 |
| `unit-test` / `e2e-test` | 테스트 작성 범위와 패턴 |
| `code-anti-patterns` | 금지 패턴 점검 (any / new Date / try-catch / 레이어 위반 등) |
| `catalog-add` / `package-installation` | npm 패키지 추가 |
| `add-app` / `add-lib` | 새 app / lib 추가 절차 (전과정) |
| `build-verification` | 구현 완료 직전 검증 (test → build → lint) |
| `git-commit` / `pull-request` | commit / PR 워크플로우 |

규칙의 핵심 요약은 [`CLAUDE.md`](./CLAUDE.md) 참고 — 한눈에 볼 수 있는 인덱스.

---

## 새 앱 / 라이브러리 추가

작업 자체는 `.claude/skills/add-app` / `add-lib` 가 단계별로 가이드. 요약하면:

- **새 앱** (`apps/<name>`): package.json / tsconfig / swcrc / env / deploy 폴더 / 루트 alias / dev 스크립트 / CI workflow / GitHub Secret / AWS 인프라
- **새 lib** (`libs/<name>`): package.json / tsconfig.lib / 각 app 의 dependencies / swcrc paths / CI projects 리스트 / **Dockerfile NODE_PATH**

자세한 단계는 해당 skill 참고.

---

## 다른 곳에서 본 프로젝트로 빠르게 익히기

처음 보는 사람을 위한 권장 학습 순서:

1. **이 README** (지금) — 5분
2. [.claude/docs/ARCHITECTURE.md](.claude/docs/ARCHITECTURE.md) — 레이어 / lib 구성 — 10분
3. [.claude/docs/SCRIPTS.md](.claude/docs/SCRIPTS.md) — 명령어 / NODE_ENV — 10분
4. `CLAUDE.md` — 코드 컨벤션 한눈에 — 15분
5. (실제 작업 시) 관련 skill 참고

운영자라면 추가로:
6. [.claude/docs/CD.md](.claude/docs/CD.md) — CD 동작 원리 — 30분
7. [.claude/docs/INFRA_SETUP.md](.claude/docs/INFRA_SETUP.md) — 첫 인프라 셋업 — 3~5시간 (실제 작업 시)
