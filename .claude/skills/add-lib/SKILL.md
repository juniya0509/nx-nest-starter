---
name: add-lib
description: starter 에 새 공유 라이브러리 (libs/<lib>) 를 추가합니다. 사용자가 "새 lib 추가", "libs/<name> 만들기", "core-something lib 추가", "공유 라이브러리 추가", "공통 모듈 추출", "shared library 만들어줘", "core-payment 라이브러리 만들어줘" 같은 요청을 할 때 반드시 이 스킬을 사용하세요. libs/<lib>/ + package.json + tsconfig.lib + index.ts 부터 시작해 각 app 의 dependencies / swcrc paths / tsconfig references 갱신, CI workflow 의 projects 리스트 갱신, Dockerfile NODE_PATH 추가까지 빠짐없이 처리합니다.
type: skill
---

# Add Lib — 새 공유 라이브러리 추가

starter 의 컨벤션을 깨지 않으면서 새 lib 를 추가할 때 거쳐야 할 단계 체크리스트.

각 단계는 **순서대로** 진행 권장.

## 이 스킬을 사용해야 하는 상황

다음 같은 요청을 받으면 이 스킬을 사용하세요:

- "core-payment 라이브러리 만들어줘"
- "libs/core-notification 추가"
- "공통 유틸 lib 분리"
- "shared library 만들어줘"
- "공통 모듈 추출해서 lib 로"

이미 starter 에 있는 `core-domain` / `core-database` / `core-enum` / `core-contract` / `core-util` 의 패턴을 그대로 따른다.

## 작업 단계

### 1. 디렉터리 + `package.json` 생성

`libs/<lib>/package.json`:

```jsonc
{
  "name": "@nx-nest-starter/<lib>",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "@nx-nest-starter/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "nx": {
    "name": "<lib>",
    "tags": ["scope:shared", "layer:<layer>"]
  },
  "dependencies": {
    /* 이 lib 가 import 하는 npm 패키지 (catalog:) + 다른 lib (workspace:*) */
  }
}
```

`tags` 의 `layer:` 값은 `domain` / `database` / `enum` / `contract` / `util` 중 적절한 것 (또는 새 layer 정의).

### 2. `tsconfig.lib.json`

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist",
    "rootDir": "../..",
    "tsBuildInfoFile": "../../dist/libs/<lib>/tsconfig.lib.tsbuildinfo",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "jest.config.cts", "src/**/*.spec.ts", "src/**/*.test.ts"],
  "references": [
    /* 이 lib 가 의존하는 다른 lib 의 tsconfig.lib.json 경로 */
  ]
}
```

다른 lib (`core-database/tsconfig.lib.json` 등) 를 그대로 복사 후 path 만 조정.

### 3. `src/index.ts` (선택 — barrel export)

현재 starter 의 컨벤션은 **deep path import** (`@libs/<lib>/src/...`) 이라 `index.ts` 가 runtime 에 직접 쓰이지는 않지만, 외부에서 `import from '@nx-nest-starter/<lib>'` 패턴을 쓸 때를 대비해 두면 좋음.

### 4. 각 app 이 이 lib 를 import 한다면 — 각 app 의 `package.json`

`apps/<app>/package.json` 의 `dependencies` 에 추가:

```jsonc
"@nx-nest-starter/<lib>": "workspace:*"
```

> ⚠️ **이게 누락되면 production install 후 transitive dep (예: lib 가 사용하는 sql-formatter) 가 컨테이너에서 못 찾는 에러 발생.**

### 5. 각 app 의 `.swcrc` 의 paths 갱신

`apps/<app>/.swcrc` 의 `jsc.paths` 에 추가:

```jsonc
"@libs/<lib>/*": ["../../../libs/<lib>/*"]
```

### 6. tsconfig references — `nx sync` 로 자동

```bash
pnpm nx sync
```

→ app 이 이 lib 를 import 하면 `tsconfig.app.json` 의 references 에 자동 추가.

### 7. 각 app 의 `package.json` 의 lint script — `--projects` 리스트에 추가

```jsonc
"lint": "nx run-many --target=lint --projects=admin-api,core-domain,...,<lib>"
```

### 8. CI workflow 의 `--projects` 리스트

`.github/workflows/pipeline-develop.yml` / `pipeline-master.yml` 의 다음 step 의 `--projects=...` 에 새 lib 추가:
- `Lint (all)`
- (필요 시) `Unit test (all)`

### 9. `Dockerfile` 의 `NODE_PATH` 갱신

루트 `Dockerfile` 의 runtime stage 의 `ENV NODE_PATH=...` colon-join 리스트에 새 lib 추가:

```dockerfile
ENV NODE_PATH=/app/apps/${APP_NAME}/node_modules:/app/libs/core-contract/node_modules:...:/app/libs/<lib>/node_modules
```

> ⚠️ **이게 누락되면 lib 자체의 transitive dep (lib 의 dependencies 에 명시한 npm 패키지) 가 runtime 에 안 잡힘.**

### 10. lib 에 DB entity 가 있다면

DB schema migration / `synchronize` / 수동 schema 처리. 각 환경 (dev / prod) DB 에 schema 적용 필요.

### 11. 검증

```bash
pnpm install                              # lockfile 갱신
pnpm nx build <lib>                       # 빌드 통과
pnpm nx build <lib 를 쓰는 app>           # 의존 app 빌드 통과
pnpm <app> test:unit                      # unit test
pnpm <app> test:e2e                       # e2e
pnpm dev                                  # 로컬 실행
```

## 자주 잊는 항목

- [ ] 각 app 의 `package.json` `dependencies` 에 `workspace:*` 명시 (pnpm 의 transitive dep 해결 위해)
- [ ] `Dockerfile` 의 `NODE_PATH` 갱신 (lib 의 transitive deps runtime 발견)
- [ ] 각 app 의 `.swcrc` paths 에 `@libs/<lib>/*` 추가
- [ ] `pnpm nx sync` 로 tsconfig references 자동 갱신
- [ ] CI workflow `--projects` 리스트에 새 lib 추가

## 참고 문서

- 아키텍처 / 레이어 / 의존성 규칙: `.claude/docs/ARCHITECTURE.md`
- 스크립트 / 빌드: `.claude/docs/SCRIPTS.md`
- CD 흐름: `.claude/docs/CD.md`
- application 추가: `add-app` skill
