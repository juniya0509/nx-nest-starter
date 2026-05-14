---
name: add-app
description: starter 에 새 NestJS application 을 추가합니다. 사용자가 "새 app 만들어줘", "apps/<name> 추가", "scheduler app 추가", "새 api 서비스 만들어줘", "새 NestJS application", "third app 만들기", "새 application 추가" 같은 요청을 할 때 반드시 이 스킬을 사용하세요. apps/<app>/ 디렉터리 + package.json + tsconfig + swcrc + env 파일 + deploy/ + 루트 alias + dev-all.sh + CI/CD workflow + GitHub Secrets + AWS 인프라 까지의 전 과정을 빠뜨림 없이 단계별로 진행합니다.
type: skill
---

# Add App — 새 NestJS application 추가

starter 의 컨벤션을 깨지 않으면서 새 app 을 추가할 때 거쳐야 할 단계 체크리스트.

각 단계는 **순서대로** 진행 권장 — lint/build/CI 가 단계 도중에 깨지는 걸 줄임.

## 이 스킬을 사용해야 하는 상황

다음 같은 요청을 받으면 이 스킬을 사용하세요:

- "scheduler app 만들어줘"
- "apps/notification-api 추가"
- "새 NestJS 서비스 만들어줘"
- "third application 추가"
- "새 API 서비스 — payment-api 만들기"

이미 starter 에 있는 admin-api / core-api / batch 의 패턴을 그대로 따른다.

## 작업 단계

### 1. 디렉터리 + `package.json` 생성

`apps/<app>/package.json`:

```jsonc
{
  "name": "@nx-nest-starter/<app>",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "lint": "nx run-many --target=lint --projects=<app>,core-domain,core-enum,core-contract,core-util,core-database",
    "test": "pnpm test:unit && pnpm test:e2e",
    "test:unit": "nx run-many --target=test --projects=<app>,core-domain --skip-nx-cache --passWithNoTests --parallel=1 --output-style=stream-without-prefixes",
    "test:e2e": "jest --config e2e-test/jest.config.cts --forceExit",
    "start:dev:local": "bash ../../scripts/dev-app.sh <app> <inspect-port>",
    "build:local": "pnpm lint && nx build <app> -c local",
    "start:local": "cross-env NODE_ENV=local node $(pwd)/../../dist/apps/<app>/src/main.js",
    "build:development": "pnpm lint && nx build <app> -c development",
    "start:development": "cross-env NODE_ENV=development node $(pwd)/../../dist/apps/<app>/src/main.js",
    "build:production": "pnpm lint && nx build <app> -c production",
    "start:production": "cross-env NODE_ENV=production node $(pwd)/../../dist/apps/<app>/src/main.js"
  },
  "nx": {
    "name": "<app>",
    "projectType": "application",
    "sourceRoot": "apps/<app>/src",
    "tags": ["app:<app>", "scope:app"],
    "targets": {
      "build": {
        "executor": "@nx/js:swc",
        "outputs": ["{options.outputPath}"],
        "options": {
          "outputPath": "dist/apps/<app>",
          "main": "apps/<app>/src/main.ts",
          "tsConfig": "apps/<app>/tsconfig.app.json",
          "swcrc": "apps/<app>/.swcrc",
          "generatePackageJson": true,
          "skipTypeCheck": true
        },
        "configurations": {
          "local": { "args": ["node-env=local"] },
          "development": { "args": ["node-env=development"] },
          "production": { "args": ["node-env=production"] }
        }
      },
      "serve": { /* admin-api 의 nx config 참고 — buildTarget / port 등 조정 */ }
    }
  },
  "dependencies": {
    "@nx-nest-starter/core-contract": "workspace:*",
    "@nx-nest-starter/core-database": "workspace:*",
    "@nx-nest-starter/core-domain": "workspace:*",
    "@nx-nest-starter/core-enum": "workspace:*",
    "@nx-nest-starter/core-util": "workspace:*",
    "@swc/helpers": "catalog:"
    /* 이 app 이 사용하는 npm 패키지 — catalog: 로 명시 */
  },
  "devDependencies": {
    /* 이 app 의 dev only 패키지 — catalog: */
  }
}
```

`i18n:download`, `swagger:generate` 등 추가 script 가 필요하면 admin-api / core-api 의 package.json 참고.

### 2. `.swcrc`

```jsonc
{
  "$schema": "https://swc.rs/schema.json",
  "sourceMaps": true,
  "jsc": {
    "parser": { "syntax": "typescript", "decorators": true, "dynamicImport": true },
    "transform": { "legacyDecorator": true, "decoratorMetadata": true },
    "keepClassNames": true,
    "target": "es2022",
    "externalHelpers": false,
    "loose": true,
    "baseUrl": "./src",
    "paths": {
      "@<app>/*": ["../*"],
      "@libs/core-domain/*": ["../../../libs/core-domain/*"],
      "@libs/core-database/*": ["../../../libs/core-database/*"],
      "@libs/core-enum/*": ["../../../libs/core-enum/*"],
      "@libs/core-contract/*": ["../../../libs/core-contract/*"],
      "@libs/core-util/*": ["../../../libs/core-util/*"]
    }
  },
  "module": { "type": "commonjs" },
  "exclude": ["jest.config.ts", ".*\\.spec.ts$", ".*\\.test.ts$"]
}
```

> **`externalHelpers: false`** 필수 — Docker runtime 에서 `@swc/helpers` 모듈 못 찾는 이슈 회피.

### 3. `tsconfig.app.json`

다른 app 의 `tsconfig.app.json` 복사. `pnpm nx sync` 가 references 자동 동기화.

### 4. env 파일

`apps/<app>/` 에 다음 파일 작성 (다른 app 의 `.env.example` 참고):

- `.env.example` (git tracked)
- `.env.local` (개발자 개인 PC)
- `.env.development` (CI / dev 서버)
- `.env.production` (CI / prod 서버)

`SERVER_PORT` 가 docker-compose 의 port mapping (admin/core 패턴이면 3000, batch 패턴이면 3001) 과 일치해야 함.

### 5. `apps/<app>/deploy/` (CD 대상이라면)

`docker-compose.yml` / `appspec.yml` / `scripts/execute.sh` — 다른 app 의 `deploy/` 복사 후 service name / port 만 수정.

### 6. 루트 `package.json` 에 alias 추가

```jsonc
"scripts": {
  "<app>": "pnpm -F @nx-nest-starter/<app>"
}
```

### 7. `scripts/dev-all.sh` 에 새 app 추가 (로컬 dev 통합)

`concurrently` 의 build watcher + nodemon 항목 추가 — admin/core/batch 의 패턴 참고.

### 8. CI/CD workflow 수정

`.github/workflows/` 의 다음 파일에 새 app 반영:

#### `pr-check.yml`
- e2e affected 분기에 새 app 추가:
  ```yaml
  if echo "$AFFECTED" | grep -q '"<app>"'; then
    echo "▶ Running <app> e2e"
    pnpm <app> test:e2e
  fi
  ```

#### `pipeline-develop.yml` / `pipeline-master.yml`
- `Decode app .env.<environment> files` step 의 디코드 라인에 새 app 추가
- `Lint / Unit test / Build / E2E` step 의 `--projects` 리스트에 새 app
- `Compute affected apps` step 의 outputs 에 새 app 추가
- 끝부분에 `deploy-<app>` job 추가 (admin-api / core-api / batch job 복사 후 `inputs.app` / `health_port` 만 수정)

#### `deploy-app.yml`
- `Decode .env.<environment>` step 의 case 문에 새 app 분기 추가 (i18n 사용 시)
- `Download i18n` step 의 case 문에도 추가 (i18n 사용 시)

### 9. GitHub Secrets / Variables

GitHub repo → Settings → Environments → `development` / `production` 각각:

| 이름 | 값 |
| - | - |
| `<APP>_ENV_BASE64` (Secret) | `apps/<app>/.env.<env>` 의 base64 |

`pnpm encoding-env-base64` 로 인코딩.

### 10. AWS 인프라

#### ECR
- repository: `nx-nest-starter-<app>` + lifecycle policy (untagged 7d, tagged keep 30)

#### 외부 traffic 받는 앱 (admin / core 패턴)

환경 × 1:
- Target Group: `nns-<app>-<env>-1` (HTTP `<port>`, 상태 검사 `/v1/health`)
- ALB: `nns-<app>-<env>-alb` (HTTP:80 → TG)
- ASG: `nx-nest-starter-<app>-<env>-asg` (`app-lt`, TG 1개 연결, EC2 health check, 첫 배포 후 ELB 로 변경)
- CodeDeploy Application: `nx-nest-starter-<app>-<env>`
- CodeDeploy DG: `nx-nest-starter-<app>-dg-<env>` — **Blue/Green, ASG 자동 복사, TG 1개 (single-TG 패턴)**, 즉시 재라우팅, 원본 5분 후 종료

#### 내부 (batch 패턴, cron only)
- ASG: `nx-nest-starter-<app>-<env>-asg` (`batch-lt`, **ALB 없음**, EC2 health check, desired=min=max=1)
- CodeDeploy Application + DG — **In-place**, 로드 밸런싱 비활성

### 11. Launch Template / Security Group 새로 만들 필요가 있나?

대부분 기존 `nx-nest-starter-app-lt` (admin/core 패턴) / `nx-nest-starter-batch-lt` (batch 패턴) + 기존 SG 재사용. 다음 경우 새로 만듦:
- 다른 instance type 필요 (메모리/CPU 다름)
- 다른 SG inbound 룰 필요 (다른 port 노출)

새 LT 의 user-data 는 admin/core/batch 와 동일 (Docker + compose plugin + AWS CLI + CodeDeploy agent).

### 12. DB schema migration

새 entity 가 있다면:
- TypeORM migration 작성 + 각 환경 DB 에 적용
- 또는 첫 가동 시 수동 schema 생성

### 13. 검증

#### 로컬
```bash
pnpm install
pnpm nx build <app> -c production
pnpm <app> test:unit
pnpm <app> test:e2e
pnpm dev                                  # 새 app 도 함께 동작 확인
```

#### CI
- develop 에 새 app 영향가는 변경 push
- `pipeline-develop.yml` 의 ci job + `deploy-<app>` job 통과
- ALB DNS 의 `/v1/health` 200 (외부 traffic 받는 앱)

#### production
- develop → master PR 머지 후 `pipeline-master.yml` 동작
- prod ALB / instance 동작 확인

## 자주 잊는 항목

- [ ] CI workflow 의 `--projects` 리스트 — lint / test / build 단계에 새 app 누락하면 빌드 안 됨
- [ ] env 파일의 `SERVER_PORT` 가 docker-compose port mapping 과 일치 (admin/core 3000 / batch 3001)
- [ ] `.swcrc` 의 `externalHelpers: false`
- [ ] `dependencies` 에 사용하는 모든 lib 를 `workspace:*` 로 명시 (없으면 pnpm 이 transitive dep 해결 안 함)
- [ ] AWS production 인프라 셋업 후 GitHub Environments `production` 의 secret/var 등록 (자주 development 만 등록하고 잊음)

## 참고 문서

- 아키텍처 / 레이어 / 의존성 규칙: `.claude/docs/ARCHITECTURE.md`
- 스크립트 / 빌드 / NODE_ENV: `.claude/docs/SCRIPTS.md`
- CD 흐름 / AWS 인프라 셋업 상세: `.claude/docs/CD.md`
- 라이브러리 추가: `add-lib` skill
