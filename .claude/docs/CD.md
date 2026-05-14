# CD (지속적 배포) 가이드

starter 의 CD 파이프라인이 **어떻게 동작하는지**, **왜 그렇게 설계됐는지**, **어떤 트레이드오프가 있는지** 를 정리한 reference 문서.

> 처음 인프라를 셋업하는 단계별 가이드는 `.claude/docs/INFRA_SETUP.md` 참고. 본 문서는 셋업 후 운영자가 동작 원리를 이해하기 위한 자료.

---

## 목차

1. [개요](#1-개요)
2. [전체 흐름](#2-전체-흐름)
3. [CI/CD workflow 구조](#3-cicd-workflow-구조)
4. [nx affected 기반 선택 배포](#4-nx-affected-기반-선택-배포)
5. [빌드 산출물 (Docker image)](#5-빌드-산출물-docker-image)
6. [Module resolution (NODE_PATH)](#6-module-resolution-node_path)
7. [CodeDeploy 패턴](#7-codedeploy-패턴)
8. [ALB Blue/Green (single-TG) 동작](#8-alb-bluegreen-single-tg-동작)
9. [런타임 시크릿](#9-런타임-시크릿)
10. [환경 / 앱 매트릭스](#10-환경--앱-매트릭스)
11. [새 환경 / 앱 추가](#11-새-환경--앱-추가)
12. [향후 개선 방향](#12-향후-개선-방향)
13. [트러블슈팅](#13-트러블슈팅)

---

## 1. 개요

### 무엇을 자동화하나

- **develop 브랜치 push** → CI (전체 검증) + CD to **development** 환경
- **master 브랜치 push** → CI (전체 검증) + CD to **production** 환경
- **PR (target=develop)** → CI only (affected 만, deploy 없음)
- **PR (target=master)** → CI (production secret 으로 검증), deploy 는 머지 후

### 사용 도구

| 단계 | 도구 |
| - | - |
| 빌드 | nx (`@nx/js:swc`) + Docker (multi-stage) |
| 이미지 저장 | AWS ECR |
| 배포 트리거 | GitHub Actions → AWS CodeDeploy |
| 패키지 보관 | AWS S3 (CodeDeploy revision zip) |
| 인스턴스 관리 | AWS EC2 + Auto Scaling Group |
| 트래픽 라우팅 | AWS ALB (admin/core), 없음 (batch) |
| 인증 | GitHub OIDC + AWS IAM Role (assume web identity) |

### 핵심 설계 원칙

1. **12-factor** — 동일 Docker image 를 dev/prod 환경에 promote, 차이는 런타임 `.env` 만
2. **affected 기반** — 변경된 앱만 재배포, libs 변경 시 의존 앱 모두
3. **strict isolation 유지** — pnpm 의 phantom dep 검출 보존 (NODE_PATH 로 dist 의 module resolution 보완)
4. **OIDC 인증** — long-lived AWS access key 없음
5. **단순 우선** — Blue/Green 의 single-TG 패턴, batch 는 In-place. 복잡한 weighted listener 등 회피

---

## 2. 전체 흐름

```
[1] GitHub push (develop / master)
        ↓
[2] GitHub Actions workflow trigger
        │
        ├── ci job (전체 lint/test/build/e2e)
        │   └── nx affected projects 계산 → outputs
        │
        └── deploy-<app> jobs (affected = true 인 앱만)
                ↓
                [3] OIDC 로 AWS IAM Role assume
                ↓
                [4] (admin/core 만) i18n:download → host 의 source 에 locale 채움
                ↓
                [5] Docker buildx build
                        ├── builder stage: 전체 workspace COPY → pnpm install → nx build production
                        └── runtime stage: builder 통째로 COPY → pnpm install --prod (dev deps 제거)
                ↓
                [6] ECR push (tag = git SHA + latest)
                ↓
                [7] CodeDeploy bundle 생성
                        ├── apps/<app>/deploy/{docker-compose.yml, appspec.yml, scripts/execute.sh}
                        ├── .env (해당 환경의 base64 secret 디코드)
                        └── .codedeploy-env (IMAGE_URI / NODE_ENV / AWS_REGION / HEALTH_PORT 등)
                ↓
                [8] aws deploy push → S3
                ↓
                [9] aws deploy create-deployment → CodeDeploy 트리거
                ↓
                [10] CodeDeploy 가 ASG 클론 생성 (Blue/Green) 또는 기존 instance 활용 (In-place)
                ↓
                [11] EC2 부팅 → CodeDeploy agent 가 S3 zip 다운로드 → execute.sh 실행
                        ├── ECR docker login
                        ├── docker compose pull (env_file: ./.env, image: ${IMAGE_URI})
                        ├── docker compose up -d
                        └── /v1/health 200 확인 loop
                ↓
                [12] (admin/core) CodeDeploy 가 새 instance 를 TG 에 register
                        ALB 가 old + new 둘 다 healthy 확인 → 점진 traffic shift → old deregister → 종료
                     (batch) In-place 라 기존 instance 의 컨테이너만 교체
```

---

## 3. CI/CD workflow 구조

`.github/workflows/` 의 4개 파일:

### `pr-check.yml`
**트리거**: `pull_request` to `develop`
**역할**: CI only, **deploy 없음**
**환경**: `development` GitHub Environment (i18n / env secret 접근)

| Job | 동작 |
| - | - |
| `ci` | nx affected 기반 lint/test/build/e2e. affected 앱만 e2e 실행 |

### `pipeline-develop.yml`
**트리거**: `push` to `develop`
**역할**: CI (전체) + CD to development
**환경**: `development`

| Job | 동작 |
| - | - |
| `ci` | 전체 lint/test/build/e2e + nx affected 계산 → outputs.affected_{admin,core,batch} |
| `deploy-admin-api` | `if: needs.ci.outputs.affected_admin == 'true'` → reusable `deploy-app.yml` 호출 (app=admin-api, env=development, health_port=3000) |
| `deploy-core-api` | 동일 (core-api) |
| `deploy-batch` | 동일 (batch, health_port=3001) |

### `pipeline-master.yml`
**트리거**: `pull_request` to `master` + `push` to `master`
**역할**: CI (전체) + CD to production
**환경**: `production`

| Job | 동작 |
| - | - |
| `ci` | 전체 검증, production environment 의 secret 사용. PR 단계에서도 동작 |
| `deploy-*` | `if: github.event_name == 'push' && needs.ci.outputs.affected_<app> == 'true'` — **PR 시엔 검증만, 머지 후 push 시에만 deploy** |

### `deploy-app.yml` (reusable)
**트리거**: `workflow_call` — 다른 workflow 가 호출
**inputs**: `app`, `environment`, `health_port`
**역할**: Docker build + ECR push + CodeDeploy 트리거

호출 측이 `inputs.app=admin-api` / `inputs.environment=development` 등 전달.

각 step:
1. checkout
2. (admin/core 만) setup + .env 디코드 + i18n:download → locale 채움
3. AWS OIDC credentials configure
4. ECR login
5. Docker buildx build & push (tag = SHA + latest)
6. CodeDeploy bundle 생성 (docker-compose + appspec + execute.sh + .env + .codedeploy-env)
7. S3 push + CodeDeploy create-deployment

### 의존성 그래프

```
pipeline-develop.yml          pipeline-master.yml         pr-check.yml
        ↓                              ↓                       │
       ci job                         ci job                  ci job
        ↓                              ↓                    (CI only)
   ┌────┴────┐                    ┌────┴────┐
   ↓    ↓    ↓                    ↓    ↓    ↓
   deploy-admin    deploy-core    deploy-batch
        ↓                ↓                ↓
        └────────────────┴────────────────┘
                         ↓
              deploy-app.yml (reusable)
```

---

## 4. nx affected 기반 선택 배포

### 동작 원리

- nx 가 source 변경과 project dep graph 를 분석해 "affected projects" 계산
- workflow 가 ci job 에서 `pnpm exec nx show projects --affected --json` 으로 추출
- deploy-* jobs 의 `if:` 조건으로 분기

### base / head SHA 결정

`nrwl/nx-set-shas@v4` 가 push 이벤트에서 자동:
- **base**: 마지막으로 성공한 같은 workflow run 의 head SHA (GitHub API 로 조회 → 그래서 `actions: read` 권한 필요)
- **head**: 현재 push 의 SHA

→ "지난 성공 이후의 변경" 만 affected 로 계산. 효율적.

PR 이벤트는 더 간단 — base=`develop` (또는 `master`), head=PR head.

### 시나리오 예시

| 변경 | affected | 재배포 |
| - | - | - |
| `apps/admin-api/src/...` 만 변경 | `admin-api` | admin-api 만 |
| `apps/admin-api/src/...` + `libs/core-domain/...` | `core-domain` + admin/core/batch (모두 core-domain 의존) | 3 앱 모두 |
| `apps/batch/...` 만 | `batch` | batch 만 |
| `libs/core-util/...` | `core-util` + 의존하는 모든 앱 | 3 앱 모두 |
| `pnpm-lock.yaml` / `nx.json` / `tsconfig.base.json` | 전체 (workspace-wide) | 3 앱 모두 |
| `.github/workflows/pipeline-develop.yml` 만 | (없음 — nx 가 workflow 파일 무시) | 0 앱 |
| `.claude/docs/CD.md` 만 | (없음) | 0 앱 |

### 한계

- **빌드 캐시 stale**: nx 가 base 를 잘못 잡으면 affected 가 비어서 잘못 skip 될 수 있음. 강제 재배포는 빈 commit 또는 의도적 workspace-wide 파일 touch
- **workflow 파일 변경은 deploy 안 함**: nx 가 인식 안 함. workflow 만 바꿔서 배포하고 싶다면 apps/<app>/ 안 사소한 변경 한 줄

---

## 5. 빌드 산출물 (Docker image)

### 단일 Dockerfile + APP_NAME build-arg

루트 `Dockerfile` 한 개로 admin-api / core-api / batch 모두 빌드:

```bash
docker buildx build --build-arg APP_NAME=admin-api .
```

### Multi-stage 구조

```
[Stage 1 — builder]
FROM node:22.14.0-alpine
WORKDIR /workspace
COPY . .                              # 전체 workspace
pnpm install --frozen-lockfile        # dev + prod deps 모두
pnpm nx build "${APP_NAME}" -c production

[Stage 2 — runtime]
FROM node:22.14.0-alpine
WORKDIR /app
COPY --from=builder /workspace/ ./    # workspace 통째로
ENV CI=true                           # pnpm 의 TTY confirm 회피
pnpm install --frozen-lockfile --prod # dev deps 제거
ENV NODE_PATH=/app/apps/<app>/node_modules:/app/libs/.../node_modules  # module resolution
CMD node dist/apps/<app>/src/main.js
```

### 빌드 시간 / 이미지 크기

| 단계 | 시간 | 비고 |
| - | - | - |
| Builder stage (pnpm install) | 약 17초 | GitHub Actions docker cache 사용 시 더 짧음 |
| Builder stage (nx build) | 약 22초 | core-domain / core-database 등 lib 도 함께 빌드 |
| Runtime stage (pnpm install --prod) | 약 5초 | builder 의 결과를 prune |
| ECR push | 약 30초 | 첫 push 는 더 길음 |
| **합계** | 약 1~2분 | |

이미지 크기는 약 **1GB 내외** (전체 workspace + node_modules 포함). 향후 슬림화 가능 — [향후 개선](#12-향후-개선-방향) 참고.

### 이미지 환경 무관 (12-factor)

같은 image (같은 git SHA tag) 가 development 와 production 양쪽에 promote 됩니다. 환경 차이는 컨테이너의 env_file (`./.env`) 만 다름.

### ECR tag 규칙

| Tag | 의미 |
| - | - |
| `<git SHA>` | 이 commit 에서 빌드된 image — 영속, lifecycle 30개 초과 시 oldest 부터 삭제 |
| `latest` | 가장 최근 push 된 image — 매번 갱신 |

---

## 6. Module resolution (NODE_PATH)

### 현재 방식

런타임 컨테이너에서 `dist/apps/<app>/src/main.js` 가 의존 패키지를 찾도록:

1. **`pnpm install --frozen-lockfile --prod`** — pnpm 의 strict isolation 유지
2. **`ENV NODE_PATH=/app/apps/<app>/node_modules:/app/libs/.../node_modules:...`** — Node 의 module resolution 이 이 경로들도 추가 검색

### 왜 이 방식인가

#### 문제 상황

`@nx/js:swc` executor 가 SWC paths 를 source 위치 상대경로로 변환해 require 에 박음:

```ts
// source: apps/admin-api/src/database/mysql/config/AdminTypeOrm.config.ts
import { ... } from '@libs/core-database/src/mysql/config/TypeOrm.config';

// compile 결과 (apps/admin-api/dist/.../*.js):
require('../../../../../../libs/core-database/src/mysql/config/TypeOrm.config');
```

이 상대 경로는 빌드 위치 무관 동일. 즉:
- **app 의 dist 와 lib 의 dist 가 workspace_root/dist/ 안에서 같은 부모를 공유해야 동작**
- nx 의 default outputPath (`dist/apps/<app>`, `dist/libs/<lib>`) 가 그 조건 충족

→ outputPath 를 옮길 수 없음 (`apps/<app>/dist` 로 옮기면 lib 의 dist 와 부모 달라져 깨짐)

#### 그래서 nx default 유지

`dist/apps/<app>/src/main.js` 에서 require 하는 deps 가 어디 있는가:
- pnpm strict 라 `/app/apps/<app>/node_modules/` 에 symlink, `/app/node_modules/.pnpm/` 에 실제 파일
- 기본 module resolution path 가 dist 의 부모만 거슬러 올라가서 `/app/node_modules` 까지만 봄

→ `NODE_PATH` 환경변수로 추가 검색 경로 명시:
```
NODE_PATH=/app/apps/admin-api/node_modules:/app/libs/core-contract/node_modules:.../core-util/node_modules
```

각 lib 의 transitive dep (sql-formatter 등) 도 검색 가능.

### Trade-off

| | 평가 |
| - | - |
| 셋업 단순성 | ✅ Dockerfile 한 줄 추가로 끝 |
| pnpm strict isolation 유지 | ✅ phantom dep 검출 가능 |
| 코드 변경 없음 | ✅ source / swc paths / nx config 손대지 않음 |
| Image 크기 | ⚠️ workspace 전체 + 모든 lib build 산출물 포함 — 1GB 내외 |
| Node.js 권장 사항 | ⚠️ `NODE_PATH` 는 Node 의 **legacy** 메커니즘 — 동작은 안정적이지만 공식 권장 아님 |
| 의존성 결합도 | ⚠️ runtime 컨테이너가 workspace 전체 구조를 알아야 동작 — "이 image 는 admin-api 만 들어있다" 의 의미가 약함 |
| 유지보수 | ⚠️ 새 lib 추가 시 Dockerfile 의 NODE_PATH 도 갱신 필요 (`add-lib` skill 가이드) |

### 향후 개선

[12. 향후 개선 방향](#12-향후-개선-방향) 참고. bundling (esbuild/webpack) 으로 NODE_PATH 자체 제거 가능.

---

## 7. CodeDeploy 패턴

starter 는 앱별로 다른 배포 타입 사용:

| 앱 | 패턴 | 이유 |
| - | - | - |
| admin-api | Blue/Green (single-TG) | 외부 traffic 받음 — 무중단 배포 |
| core-api | Blue/Green (single-TG) | 외부 traffic 받음 — 무중단 배포 |
| batch | In-place | cron only, 잠시 down 허용 |

### Blue/Green (admin/core)

- CodeDeploy 가 **클론 ASG** 를 만들어 새 instance 부팅
- 새 instance 가 healthy 되면 점진적 traffic shift
- 기존 instance 는 5분 후 종료

**장점**: 무중단, rollback 빠름 (traffic 다시 원본으로)
**단점**: 일시적 2배 EC2 instance 비용

### In-place (batch)

- 기존 instance 에서 컨테이너 교체
- ApplicationStop → DownloadBundle → BeforeInstall → Install → AfterInstall (execute.sh) → ApplicationStart
- 컨테이너 down + up 사이 몇 초~수십 초 간 batch unavailable

**장점**: 인프라 비용 변동 없음, 셋업 단순
**단점**: 짧은 down — batch 는 cron 이라 허용 가능

### CodeDeploy 가 일시 중단하는 ASG 프로세스

deployment 중 ASG 의 6가지 자동 조정 프로세스를 suspend:

| 프로세스 | 정지 이유 |
| - | - |
| ScheduledActions | 배포 중 capacity 변경 방지 |
| AlarmNotification | alarm 으로 인한 scale 변경 방지 |
| ReplaceUnhealthy | 부팅 중 일시적 unhealthy 로 무한 교체 방지 |
| InstanceRefresh | 배포와 refresh 중복 방지 |
| AddToLoadBalancer | CodeDeploy 가 직접 TG attach 관리 |
| AZRebalance | instance 이동 방지 |

정상 종료 시 자동 `ResumeProcesses`. 비정상 중단 시엔 stuck 가능 → [트러블슈팅](#13-트러블슈팅) 참고.

---

## 8. ALB Blue/Green (single-TG) 동작

starter 는 **TG 1개만 사용**하는 single-TG 패턴.

### 흐름 상세

```
[deployment 시작 전]
  ALB listener: HTTP:80 → forward to TG_1
  TG_1: [original_instance_1, original_instance_2, ...]      (active)

[deployment 시작 — CodeDeploy 가]
  1. 원본 ASG 의 정의 (Launch Template + 설정) 복사 → 클론 ASG 생성
  2. 클론 ASG 에서 새 instance N 대 부팅
  3. user-data 가 Docker / CodeDeploy agent 설치
  4. CodeDeploy agent 가 S3 zip 다운로드 → execute.sh 실행
  5. execute.sh 가 ECR pull → docker compose up → /v1/health 200 확인
  6. CodeDeploy 가 새 instance 들을 TG_1 에 register

[중간 상태]
  ALB listener: HTTP:80 → forward to TG_1
  TG_1: [original_1, original_2, new_1, new_2, ...]          (양쪽 다 healthy)
  ALB 가 traffic 을 모든 healthy target 으로 분산 (라운드 로빈)

[deployment 마무리]
  CodeDeploy 가 original instance 를 deregister + (5분 후) 종료
  ALB connection draining 으로 in-flight 요청 완료 후 종료
  최종: TG_1 = [new_1, new_2, ...]
```

### 왜 single-TG 인가 (vs legacy 2-TG)

#### Legacy 2-TG 패턴 (starter 가 사용 안 함)

- TG 1 (Blue), TG 2 (Green) 두 개
- CodeDeploy 가 deployment 시 listener default action 을 TG_1 → TG_2 로 swap (`ModifyListener` API)
- 새 traffic 이 TG_2 로 가고 TG_1 은 idle

문제:
- listener swap 단계 (`AllowTraffic`) 가 어떤 이유로 stuck 되면 **무한 대기** (실제 starter 셋업 중 발생)
- ModifyListener API 호출 자체가 일어나지 않는 케이스도 있음 (CloudTrail 로 추적)

#### Single-TG (starter 채택)

- TG 1개만 사용
- listener 는 절대 변경되지 않음 — 항상 forward to TG_1
- traffic shift 는 TG 의 target list 변경으로 (register / deregister)

장점:
- listener swap 없음 → ModifyListener 미스 가능성 0
- AWS API 호출이 단순 (RegisterTargets / DeregisterTargets 만)
- 운영 mental model 단순 ("ASG 가 새 instance 띄우고 TG 에 등록한다")

### 트래픽 안전성

- ALB 가 connection draining (default 300초) 으로 deregister 된 instance 의 in-flight 요청 완료까지 대기
- 새 instance 가 unhealthy 되면 ALB 가 알아서 라우팅 안 함
- 점진적 shift 라 갑작스런 spike 위험 적음

---

## 9. 런타임 시크릿

### 흐름

```
[운영자 로컬]
  apps/<app>/.env.<env>      # secret 값들 (DB pwd / API keys / ...)
        ↓ pnpm encoding-env-base64
  base64 문자열
        ↓ 운영자가 복사
[GitHub Environments]
  <APP>_ENV_BASE64 (secret)  # development / production 환경별 등록

[배포 시]
  deploy-app.yml step:
    .env decode → deploy-bundle/.env
  CodeDeploy bundle (.env 포함) → S3
        ↓
[EC2]
  CodeDeploy agent 가 zip 풀어 /home/ubuntu/deploy/.env 로 저장
  docker-compose.yml 의 env_file: ./.env 가 컨테이너에 env vars inject
```

### 보안 강화 (현재 상태)

- S3 bucket: KMS / SSE-S3 암호화 + Public block + lifecycle 30일
- EC2 IAM Role 만 S3 read 가능
- EC2 의 `.env` 파일은 chmod 600

### 향후 개선

[12. 향후 개선 방향](#12-향후-개선-방향) 참고. AWS Secrets Manager / SSM Parameter Store 이행으로 자동 rotation + CloudTrail audit.

---

## 10. 환경 / 앱 매트릭스

| 환경 | 트리거 | GitHub Environment | AWS region |
| - | - | - | - |
| development | push to `develop` | `development` | (단일 — region 통일) |
| production | push to `master` | `production` | (단일) |

| 앱 | 외부 traffic | 배포 타입 | 포트 | health check |
| - | - | - | - | - |
| admin-api | ALB | Blue/Green single-TG | 3000 | `/v1/health` |
| core-api | ALB | Blue/Green single-TG | 3000 | `/v1/health` |
| batch | 없음 (cron) | In-place | 3001 (internal only) | `/v1/health` (execute.sh self-check 만) |

총 인프라 단위: 환경 × 앱 = **6 개의 CodeDeploy DG** + ALB/TG 4 (admin/core 만, 환경 × 2 = 4).

---

## 11. 새 환경 / 앱 추가

### 새 환경 추가 (예: staging)

1. GitHub Environments 에 `staging` 생성 + secret/var 등록
2. AWS: S3 bucket + 각 앱의 ALB/TG/ASG/CodeDeploy App+DG 셋업 (`INFRA_SETUP.md` 의 "환경별 셋업" 섹션 반복)
3. 새 workflow `.github/workflows/pipeline-staging.yml` 작성 — pipeline-develop.yml 복사 후 `environment: staging`, `main-branch-name: staging` (또는 사용할 브랜치명) 으로 수정
4. (선택) 새 브랜치 `staging` 만들기

### 새 앱 추가

`.claude/skills/add-app/SKILL.md` 의 단계 따름 — package.json / tsconfig / swcrc / env / deploy / CI workflow / GitHub Secret / AWS 인프라 까지.

### 새 라이브러리 추가

`.claude/skills/add-lib/SKILL.md` 의 단계 따름 — package.json / tsconfig.lib / app 의 dependencies+paths+references / **Dockerfile NODE_PATH** 갱신.

---

## 12. 향후 개선 방향

우선순위 순:

### 1순위 — Bundling 도입 (`@nx/esbuild` 또는 `@nx/webpack`)

**현재 문제**:
- runtime image 가 1GB 내외 (workspace 전체 포함)
- NODE_PATH 라는 legacy 메커니즘 의존
- 새 lib 추가 시 Dockerfile 갱신 필요

**bundling 후**:
- 모든 source + lib + npm deps 가 단일 bundle 로 inline
- runtime 컨테이너에 `node_modules` 거의 필요 없음 (native deps 만)
- image 크기 수십 MB
- NODE_PATH 자체 제거
- module resolution 이슈 사라짐

**Trade-off**:
- 빌드 시간 약간 증가 (bundling step)
- source map / debugger 동작이 약간 까다로움
- native module (firebase-admin 의 일부) 호환성 검증 필요

**적용 시점**: starter 졸업 후 첫 번째 검토 대상.

### 2순위 — Workspace package 컨벤션

**현재**:
- app 코드가 `@libs/core-domain/src/domain/auth/Auth.service` 같은 deep path import
- swc paths 가 source 직접 가리킴

**변경 후**:
- 각 lib 가 `src/index.ts` barrel export
- app 의 import 가 `@nx-nest-starter/core-domain` (package level only)
- swc paths 단순화 또는 제거

**장점**:
- lib 의 public API 경계 명확 (private 코드 export 안 하면 외부에서 접근 못 함)
- npm publish 까지 가는 길이 열림
- pnpm 의 module resolution 이 표준 npm package 처럼 동작

**Trade-off**:
- starter 의 컨벤션 전반 변경 — 모든 app 의 import 문 수정 (수십~수백 곳)
- lib API 가 안정된 후 검토

### 3순위 — Secrets 관리를 AWS Secrets Manager / SSM Parameter Store 로 이행

**현재**: GitHub Secret base64 → S3 zip 의 .env → 컨테이너 env_file

**문제**:
- secret 회전 시 매번 base64 재인코딩 + GitHub Secret 갱신 + 재배포 필요
- S3 zip 에 평문 (S3/EC2 측 권한 제한으로 보완)
- AWS audit 추적 없음 (GitHub audit 만)

**이행 후**:
- 컨테이너 entrypoint 가 SDK 로 Secrets Manager / SSM 호출 → env vars 주입
- 자동 rotation (예: DB 비번)
- CloudTrail audit
- 메모리에만 secret 존재 (EC2 디스크에 평문 없음)

**Trade-off**:
- Secrets Manager: secret 당 $0.4/월
- 컨테이너 entrypoint 코드 추가 필요
- 적은 secret 부터 단계적 이행 가능 (e.g. DB pwd 만 먼저)

### 4순위 — production HA / observability

- ALB 에 ACM 인증서 + HTTPS:443 (HTTP:80 redirect)
- production ASG min 을 2 이상 (single point of failure 제거)
- CloudWatch agent 또는 fluent-bit 로 Docker 로그 수집
- CloudWatch alarms (ALB 5xx 비율 / Target unhealthy / ASG capacity)
- Sentry / Slack 알림 연동 (현재 코드 단의 Sentry 캡처와 별개)

### 5순위 — Multi-region / Disaster Recovery

(starter 졸업 후, 운영 규모가 커지면 검토)

---

## 13. 트러블슈팅

빈도 순:

### 컨테이너 부팅 시 `Cannot find module '@nestjs/common'` 또는 `'@swc/helpers'`

**원인**: NODE_PATH 가 deps 위치를 못 찾음 — 새 lib 추가 후 Dockerfile NODE_PATH 갱신 잊었을 가능성

**대응**:
- Dockerfile 의 `ENV NODE_PATH=...` 에 해당 lib 의 `/app/libs/<lib>/node_modules` 추가
- 또는 app 의 `package.json` `dependencies` 에 lib 가 `workspace:*` 로 명시되었는지

### 컨테이너 부팅 시 `Cannot find module '<lib-internal-package>'` (예: sql-formatter)

**원인**: lib 가 의존하는 transitive 패키지가 admin-api/node_modules 에 hoist 안 됨

**대응**:
- 각 app 의 `package.json` `dependencies` 에 해당 lib 를 `workspace:*` 로 명시 (pnpm 이 transitive dep 처리)
- 새 lib 추가 시 Dockerfile NODE_PATH 에도 추가

### CodeDeploy "ScriptFailed at scripts/execute.sh, exit code 1"

**원인**: execute.sh 의 self health check loop 가 200 못 받음

**대응**:
1. SSM 접속 → `docker logs <container>` 로 컨테이너 에러 확인
2. 자주 발생하는 케이스:
   - `.env` 의 SERVER_PORT 가 잘못 (admin/core 는 3000, batch 는 3001 이어야)
   - DB connection error (schema 없음, credential 잘못)
   - i18n locale 디렉터리 없음 (admin/core — deploy-app.yml 의 i18n:download step 동작 확인)

### "ScriptFailed" — `Cannot find module '@swc/helpers/_/_interop_require_default'`

**원인**: `.swcrc` 의 `externalHelpers: true` 로 인해 SWC 가 helper 함수를 require 형태로 외부 의존

**대응**: 각 앱의 `.swcrc` 에 `"externalHelpers": false` 로 변경 → SWC 가 helper 코드를 inline

### Deployment 가 AllowTraffic 단계에서 무한 stuck, CloudTrail 에 ModifyListener 호출 없음

**원인**: CodeDeploy DG 에 TG 가 **2개 등록**되어 legacy listener-swap 패턴 trigger

**대응**:
- DG 편집 → 로드 밸런서 섹션에서 TG 1개만 남기기
- 잉여 `-2` TG 삭제 가능

### Deployment 중지 후 ASG 의 suspended processes 가 그대로

**원인**: CodeDeploy 가 자동 ResumeProcesses 호출 못 함 (강제 중단 시)

**대응**:
```bash
aws autoscaling resume-processes \
  --auto-scaling-group-name <ASG_NAME> \
  --scaling-processes ScheduledActions AlarmNotification ReplaceUnhealthy InstanceRefresh AddToLoadBalancer AZRebalance
```

위험 — 특히 `AddToLoadBalancer` 와 `ReplaceUnhealthy` 가 정지된 채 운영되면 새 instance 가 TG attach 안 되고 unhealthy 자동 교체도 안 됨.

### "Table 'xxx' doesn't exist" (production 부팅 시)

**원인**: prod DB 가 빈 상태 — schema 없음

**대응**: `INFRA_SETUP.md` 의 "7. DB schema 초기화" 참고. dev DB schema dump → prod 적용 또는 TypeORM migration.

### `nrwl/nx-set-shas` 에서 "Resource not accessible by integration"

**원인**: workflow permissions 의 `actions: read` 누락

**대응**: pipeline-* workflow 의 `permissions:` 블록에 `actions: read` 추가

### "Resource not accessible by integration" — `Input required and not supplied: aws-region`

**원인**: GitHub Variables 의 `AWS_REGION` 미등록 또는 environment scope mismatch

**대응**: repo Settings → Variables → Repository variables 에 `AWS_REGION` 등록

### `pnpm install --frozen-lockfile --prod` 가 "ABORTED_REMOVE_MODULES_DIR_NO_TTY"

**원인**: pnpm 이 dev deps 제거 시 인터랙티브 confirm 요청, Docker 의 TTY 없음

**대응**: Dockerfile runtime stage 에 `ENV CI=true` 추가 (starter 에 이미 적용됨)

### affected 가 비어서 deploy job 이 스킵

**원인**: 의도된 동작 — 코드 변경 없으면 재배포 안 함

**대응**: 강제 재배포 필요시 `apps/<app>/` 안 sensible 변경 한 줄 추가 (README, comment 등)

---

## 참고 문서

- 처음 셋업 단계별 가이드: `.claude/docs/INFRA_SETUP.md`
- 아키텍처 / 레이어 / 의존성 규칙: `.claude/docs/ARCHITECTURE.md`
- 스크립트 / NODE_ENV / .env 매핑: `.claude/docs/SCRIPTS.md`
- 새 app 추가: `add-app` skill
- 새 lib 추가: `add-lib` skill
