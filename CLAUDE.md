# 프로젝트: Nx Nest Starter

## 프로젝트 개요
이 프로젝트는 Nest.js Nx/Monorepo 기반의 백엔드 보일러플레이트입니다.

## 아키텍처 및 기술 스택
- 아키텍처 : Layered Architecture (Application → Domain → Implementation → Database)
- 프레임워크 : Nest.js, Nx
- 언어 : TypeScript
- 데이터베이스/ORM : MySQL 8.0.x / TypeORM
- 패키지매니저 : Pnpm

## 규칙
- 프로젝트 구조를 파악하고 구조에 맞게 코드를 작성합니다.
- 레이어는 Application → Domain → Implementation → Database 순의 단방향 참조만 허용합니다. 예외는 Implementation 내부 상호 참조와 `batch` 앱의 Database 직접 접근뿐입니다. (상세: `.claude/docs/ARCHITECTURE.md`)
- `admin-api`의 모든 파일명/클래스명 앞에는 반드시 `Admin` prefix를 붙입니다. (상세: `naming-convention` skill)
- 데이터베이스 엔티티는 변경을 직접 요청하지 않은경우 절대로 코드를 수정하지 않습니다. (상세: `typeorm-entity` skill)
- 에러 코드는 앱별 에러 상수 파일에서만 import해 사용합니다. (`core-api` → `apps/core-api/src/support/error/ApiError.ts`, 공용 도메인 → `libs/core-domain/src/support/error/CoreDomainError.ts`, `admin-api` → `apps/admin-api/src/support/error/AdminApiError.ts`. 상세: `error-handling` skill)
- 패키지 설치 시 런타임 의존성(`dependencies`)과 개발 의존성(`devDependencies`)을 반드시 구분합니다. 특정 애플리케이션에서만 사용하는 패키지는 루트가 아닌 해당 애플리케이션(`core-api`, `admin-api` 등)에 설치합니다. (상세: `package-installation` skill)
- 기능 추가/수정 시 해당 도메인의 **단위 + E2E 테스트 작성·갱신은 필수**이며, **모든 테스트가 통과해야 완료로 인정**합니다. 빌드/린트는 테스트 통과 후 진행합니다 (순서: 테스트 → 빌드 → 린트). **기능 버그가 있는데 통과시키려고 테스트를 약화/skip/삭제하는 것은 금지** — 테스트가 실패하면 코드를 고칩니다. (상세: `build-verification` skill)
- 단위 테스트는 **Service / Implement Layer(Reader/Creator/Updater/Deleter) + Batch cron handler 만** 작성합니다. DTO·Data·Result·Repository·Controller는 단위 테스트 대상이 아닙니다 (Repository·Controller는 E2E로 커버, DTO·Data·Result는 framework·언어 동작 검증으로 흘러 신호가 낮음). 실행: `pnpm admin test:unit` / `pnpm core test:unit` / `pnpm batch test:unit`. (상세: `unit-test` skill)
- E2E 테스트는 **testcontainers MySQL + supertest + 시드 admin/user + 실 JWT** 패턴으로 작성합니다. Controller / Repository / 가드 권한 분기 / SQL 의미를 모두 이 레이어에서 검증합니다. 위치는 `apps/<app>/e2e-test/`이며 실행은 `pnpm admin test:e2e` / `pnpm core test:e2e` / `pnpm batch test:e2e`. (상세: `e2e-test` skill)
- 프로젝트의 모든 pnpm 스크립트(루트/앱/CI)는 실행 위치, NODE_ENV, `.env` 파일 매핑이 정해져 있습니다. 스크립트를 추가/수정하거나 호출 환경을 결정할 때 참고합니다. (상세: `.claude/docs/SCRIPTS.md`)
- CD 는 Docker image + ECR + CodeDeploy 패턴 — nx affected 기반으로 변경된 앱만 재배포합니다. 새 환경/앱 추가, AWS 인프라 셋업, GitHub Secret/Var 등록은 가이드 참고. (상세: `.claude/docs/CD.md`)
- 새 앱(`apps/<app>`) 추가는 `add-app` skill, 새 라이브러리(`libs/<lib>`) 추가는 `add-lib` skill 을 따릅니다. 두 skill 모두 package.json / tsconfig / swcrc / CI workflow / Dockerfile NODE_PATH / AWS 인프라까지 빠뜨림 없이 진행합니다.

> 세부 구현 규칙은 `.claude/skills/` 하위 SKILL.md로 분리되어 있으며, 관련 작업 시 자동 로드됩니다.

## 프로젝트 구조
```
nx-nest-starter/
├── apps/                                        # NX Monorepo 애플리케이션
│   ├── admin-api/                               # 어드민 API 서비스
│   │   ├── deploy/                              # 배포 설정 (appspec.yml, docker, scripts)
│   │   └── src/
│   │       ├── controller/                      # Application Layer - Controller, DTO (도메인별 구성)
│   │       ├── database/                        # Database Layer
│   │       │   └── mysql/
│   │       │       ├── config/                  # AdminTypeOrm.config.ts
│   │       │       └── entity/                  # 어드민 전용 엔티티 (도메인별 구성)
│   │       ├── domain/                          # Domain/Implementation Layer (도메인별 service/reader/creator/...)
│   │       ├── enum/                            # AdminUser.enum.ts
│   │       ├── i18n/                            # 다국어 리소스 (locale)
│   │       ├── middleware/
│   │       │   └── auth/                        # 어드민 인증 미들웨어
│   │       ├── module/                          # Nest.js 모듈 (AdminApiApp.module.ts, 도메인별 모듈)
│   │       ├── support/                         # 공통 지원 모듈
│   │       │   ├── api-docs/                    # Swagger
│   │       │   ├── dotenv/
│   │       │   ├── error/                       # AdminApiError
│   │       │   ├── exception/
│   │       │   ├── formatter/
│   │       │   ├── logger/
│   │       │   ├── monitoring/
│   │       │   ├── notifier/
│   │       │   └── response/
│   │       └── main.ts
│   ├── core-api/                                # 코어 API 서비스
│   │   ├── deploy/                              # 배포 설정 (appspec.yml, docker, scripts)
│   │   └── src/
│   │       ├── controller/                      # Application Layer - Controller, DTO (도메인별 구성)
│   │       ├── i18n/                            # 다국어 리소스 (locale)
│   │       ├── middleware/
│   │       │   └── auth/                        # 사용자 인증 미들웨어
│   │       ├── module/                          # Nest.js 모듈 (CoreApiApp.module.ts, 도메인별 모듈)
│   │       ├── support/                         # 공통 지원 모듈
│   │       │   ├── api-docs/                    # Swagger
│   │       │   ├── dotenv/
│   │       │   ├── error/                       # ApiError
│   │       │   ├── exception/
│   │       │   ├── logger/
│   │       │   ├── monitoring/
│   │       │   ├── notifier/
│   │       │   └── response/
│   │       └── main.ts
│   └── batch/                                   # 배치 (cron) 서비스 — admin/core 영역 모두 커버 (DB Layer 직접 접근 허용)
│       ├── deploy/                              # 배포 설정 (appspec.yml, docker, scripts)
│       └── src/
│           ├── batch/                           # @Cron 데코레이터 적용 cron handler (도메인별 구성)
│           ├── database/                        # Database Layer - BatchTypeOrm.config.ts
│           ├── module/                          # Nest.js 모듈 (BatchAppApp.module.ts, BatchHealth.module.ts)
│           ├── support/                         # 공통 지원 모듈 (dotenv 등)
│           └── main.ts
├── libs/                                        # 공통 라이브러리 (Nx libs)
│   ├── core-contract/                           # 외부 서비스 계약
│   │   └── src/
│   │       ├── push/                            # Push.contract-options.ts
│   │       └── sms/                             # Sms.contract-options.ts
│   ├── core-database/                           # DB Layer 공통 (MySQL + TypeORM)
│   │   └── src/
│   │       ├── mysql/
│   │       │   ├── config/                      # TypeOrm.config.ts, TypeOrmLogger.config.ts
│   │       │   ├── decorator/                   # TypeOrmCustomRepository.decorator.ts
│   │       │   ├── entity/                      # Base.entity.ts + 공유 엔티티 (도메인별 구성)
│   │       │   └── module/                      # TypeOrmCustomRepository.module.ts
│   │       └── support/
│   │           └── notifier/
│   ├── core-domain/                             # Domain/Implementation Layer 공유
│   │   └── src/
│   │       ├── domain/                          # 도메인별 service/reader/creator/...
│   │       └── support/
│   │           ├── error/                       # CoreDomainError
│   │           └── formatter/
│   └── core-enum/                               # 공통 Enum (도메인별 구성)
│   └── core-util/                               # 공통 유틸
├── dist/                                        # 빌드 산출물
├── .claude/                                     # Claude Code 프로젝트 설정
│   ├── docs/                                    # 아키텍처/기획 설계 문서 (ARCHITECTURE.md, PRD.md 등)
│   └── skills/                                  # 프로젝트 전용 skill 정의 (layered-architecture, dto-convention 등)
├── .github/                                     # GitHub Actions 워크플로우
├── .nx/                                         # Nx 캐시
├── nx.json                                      # Nx 워크스페이스 설정
├── package.json                                 # 루트 의존성
├── pnpm-workspace.yaml                          # Pnpm workspace
├── tsconfig.base.json
├── tsconfig.json
```
