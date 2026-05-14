# 스크립트 가이드

프로젝트의 npm/pnpm 스크립트가 어디서 도는지, NODE_ENV 와 어떤 .env 파일을 사용하는지 정리합니다.

## 실행 환경 매트릭스

| 실행 위치 | NODE_ENV | .env 파일 | 비고 |
| - | - | - | - |
| 로컬 개발 PC | `local` | `.env.local` | 개발자 본인 PC. `pnpm dev` 등 |
| CI (GitHub Actions, PR → develop / push to develop) | `development` | `.env.development` | `environment: development` |
| CI (GitHub Actions, master) | `production` | `.env.production` | `environment: production` |
| EC2 (dev 환경) 의 docker container | `development` | `.env.development` (CodeDeploy bundle 의 `.env` 가 컨테이너 `env_file` 로 inject) | `node dist/apps/<app>/src/main.js` |
| EC2 (prod 환경) 의 docker container | `production` | `.env.production` | 동일 |

> **EC2 측 흐름** — CodeDeploy 가 bundle 의 `.env` 를 `/home/ubuntu/deploy/.env` 로 풀고, `docker-compose.yml` 의 `env_file: ./.env` 와 `environment: NODE_ENV=${NODE_ENV}` 가 컨테이너에 env 변수로 inject. `NODE_ENV` 자체는 execute.sh 가 `.codedeploy-env` 에서 source 한 값. EC2 호스트에서 `pnpm <app> start:*` 같은 명령을 직접 실행하지는 않습니다.

`NODE_ENV` 미지정 시 `(Admin)GetEnvFilePath.ts` 에서 `'local'` 로 fallback — 로컬에서 도구 스크립트(i18n:download / swagger:generate) 를 prefix 없이 호출할 수 있게 함.

## 루트 스크립트 (`package.json`)

| 스크립트 | 실행 위치 | 설명 |
| - | - | - |
| `pnpm dev` | 로컬 | `admin-api` + `core-api` + `batch` 를 한 번에 띄움 (concurrently). `scripts/dev-all.sh` |
| `pnpm catalog:add` | 로컬 | pnpm catalog 에 패키지 추가 자동화. `scripts/catalog-add.mjs` (인터랙티브) |
| `pnpm encoding-env-base64` | 로컬 | `apps/<app>/.env.<environment>` 파일을 base64 인코딩 (GitHub Secret 등록용). `scripts/encoding-env.mjs` (인터랙티브) |
| `pnpm admin <script>` | 로컬/CI | `admin-api` 의 스크립트 실행 — `pnpm -F @nx-nest-starter/admin-api` alias |
| `pnpm core <script>` | 로컬/CI | `core-api` 의 스크립트 실행 |
| `pnpm batch <script>` | 로컬/CI | `batch` 의 스크립트 실행 |

## 앱 스크립트

세 앱(`admin-api` / `core-api` / `batch`) 이 공통적으로 갖는 스크립트와 앱별 특수 스크립트.

### 공통 (admin-api / core-api / batch)

| 스크립트 | 실행 위치 | NODE_ENV | 설명 |
| - | - | - | - |
| `start:dev:local` | 로컬 | `local` | `nx serve` watch 모드. `scripts/dev-app.sh` 가 nx reset + dist 정리 후 띄움 |
| `build:local` | 로컬 | `local` | lint + nx build (`-c local`) |
| `build:development` | CI / 빌드머신 | `development` | lint + nx build (`-c development`) |
| `build:production` | CI / 빌드머신 | `production` | lint + nx build (`-c production`) |
| `start:local` | 거의 사용 X | `local` | dist 산출물을 NODE_ENV=local 로 실행 (디버깅용) |
| `start:development` | dev | `development` | dist 산출물을 NODE_ENV=development 로 실행 |
| `start:production` | prod | `production` | dist 산출물을 NODE_ENV=production 로 실행 |
| `lint` | 로컬/CI | - | 해당 앱 + 의존 라이브러리 lint |
| `test` | 로컬/CI | - | `test:unit` + `test:e2e` |
| `test:unit` | 로컬/CI | - | Service / Implement / Batch cron 단위 테스트 |
| `test:e2e` | 로컬/CI | - | testcontainers MySQL + supertest e2e |

### admin-api / core-api 만

| 스크립트 | 실행 위치 | NODE_ENV | 설명 |
| - | - | - | - |
| `i18n:download` | 로컬 + CI | 호출자 결정 (fallback `local`) | Lokalise 에서 번역 zip 다운로드 → `src/i18n/locale/` 에 추출. CI 에선 step `env: NODE_ENV: development` (or `production`) 로 호출 |
| `swagger:generate` | 로컬 전용 | `local` (cross-env 로 박힘) | NestJS 앱을 부팅해 Swagger JSON/YAML 생성. dev/prod 환경에선 호출되지 않음 — NODE_ENV=local 박혀있어 다른 환경에서 우발적으로 실행돼도 `.env.local` 만 찾고 끝남 |

> **언제 swagger:generate 를 다시 호출해야 하나** — Controller / DTO / 인증 데코레이터 등 API 문서 (`swagger.json` / `swagger.yaml`) 에 영향이 가는 변경 시. 상세는 `swagger-api` skill 참고.

### batch 만

batch 는 i18n / swagger 사용 안 함. 배포 단위도 다름 — **ALB 없이 단일 EC2 + In-place 배포** (cron only). 상세는 `.claude/docs/CD.md` 의 "ALB Blue/Green vs In-place" 섹션 참고.

## CI/CD workflow 와 스크립트 매핑

각 workflow 는 시작 시 모든 앱의 `.env.<environment>` 를 GitHub Secret(base64) 에서 디코드합니다 — `ADMIN_API_ENV_BASE64`, `CORE_API_ENV_BASE64`, `BATCH_ENV_BASE64`. batch 는 testcontainers 가 동적 주입하지만 통일성을 위해 포함합니다.

| Workflow | 트리거 | environment | 동작 |
| - | - | - | - |
| `pr-check.yml` | PR → develop | `development` | CI only — `nx affected` lint/test/build, e2e (affected) |
| `pipeline-develop.yml` | push to develop | `development` | CI (전체) + CD (affected 앱만 ECR push + CodeDeploy) |
| `pipeline-master.yml` | PR + push to master | `production` | CI (전체) — PR 시엔 검증만, push 시엔 CD 까지 (affected 앱만) |
| `deploy-app.yml` | (reusable) | inputs.environment | pipeline-develop / pipeline-master 가 호출 — Docker build → ECR push → S3 → CodeDeploy |

상세한 CD 흐름과 AWS 인프라 셋업 가이드는 `.claude/docs/CD.md` 참고.

## NODE_ENV 별 .env 파일 사용처

| 파일 | 어디서 로드되나 |
| - | - |
| `.env.local` | 로컬 개발 PC: 앱 부팅(`start:dev:local`), `swagger:generate`, NODE_ENV 미지정으로 호출한 `i18n:download` |
| `.env.development` | CI(PR→develop, push develop) 의 `i18n:download`, dev 서버의 앱 부팅 |
| `.env.production` | CI(master) 의 `i18n:download`, prod 서버의 앱 부팅 |
| `.env.test` | (예약) 자동화 테스트 — 현재 e2e 는 testcontainers 가 동적 주입하므로 미사용 |

## 로컬에서 자주 쓰는 명령 모음

```bash
# 전체 앱 동시 개발 (admin + core + batch)
pnpm dev

# 단일 앱 개발
pnpm admin start:dev:local
pnpm core start:dev:local
pnpm batch start:dev:local

# i18n 번역 다운로드 (로컬, .env.local 사용)
pnpm core i18n:download
pnpm admin i18n:download

# Swagger 문서 생성 (로컬 전용)
pnpm core swagger:generate
pnpm admin swagger:generate

# 단위 테스트 / e2e
pnpm admin test:unit
pnpm core test:e2e

# pnpm catalog 에 패키지 추가 (인터랙티브)
pnpm catalog:add

# GitHub Secret 등록용 .env base64 인코딩 (인터랙티브 — 앱 + 환경 선택)
pnpm encoding-env-base64
```
