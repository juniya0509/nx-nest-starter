---
name: import-convention
description: import 경로 작성 규칙. 같은 워크스페이스(앱·lib) 내부는 **상대경로**, 다른 워크스페이스(주로 `apps → libs`) 참조는 **절대경로 alias** 사용. 새 import 추가, `from '@admin-api/...'` / `from '@core-api/...'` / `from '@libs/...'` 작성, 상대경로 vs 절대경로 결정, ESLint `@nx/enforce-module-boundaries` 위반 해결, path alias 추가 시 사용.
---

# Import 경로 규칙

## 핵심 원칙

| 상황 | 스타일 | 예시 |
|---|---|---|
| **같은 워크스페이스 내부** | 상대경로 | `from './User.service'`, `from '../error/AdminApiError'` |
| **다른 워크스페이스 참조** (apps → libs) | 절대경로 alias | `from '@libs/core-domain/src/support/error/CoreDomainError'` |

### 왜 이렇게 나누는가
- **상대경로(같은 워크스페이스)**: 폴더가 통째로 이동·추출돼도 깨지지 않음. nx 모듈 경계 유지. PR 리뷰 시 같은 워크스페이스 안인지 밖인지 시각적으로 구분.
- **절대경로(다른 워크스페이스)**: lib 참조가 등장하는 순간 "경계를 넘는다"는 신호. 코드 읽을 때 의존 방향이 한눈에 보임.

---

## Path alias 매핑

`tsconfig.base.json`에 정의된 alias (단일 출처):

```json
{
  "@admin-api/*": ["apps/admin-api/*"],
  "@core-api/*": ["apps/core-api/*"],
  "@batch/*": ["apps/batch/*"],
  "@libs/core-domain/*":   ["libs/core-domain/*"],
  "@libs/core-database/*": ["libs/core-database/*"],
  "@libs/core-enum/*":     ["libs/core-enum/*"],
  "@libs/core-contract/*": ["libs/core-contract/*"]
}
```

→ 매핑이 `/src`를 포함하지 않기 때문에 import path에 **`/src`를 명시적으로** 적습니다.

`apps/admin-api/.swcrc`, `apps/core-api/.swcrc`, `apps/batch/.swcrc` 에도 동일 매핑이 미러링돼 있습니다 (런타임 해석용). alias를 추가/변경할 땐 **모든 .swcrc** 갱신해야 합니다.

---

## 상황별 가이드

### 1) 같은 앱 안 → 상대경로

```ts
// ✅ apps/admin-api/src/support/exception/AdminApiExceptionFilter.ts
import { AdminApiError } from '../error/AdminApiError';
import { AdminApiResponse } from '../response/AdminApiResponse';

// ❌
import { AdminApiError } from '@admin-api/src/support/error/AdminApiError';
```

ESLint `@nx/enforce-module-boundaries` 규칙이 이 케이스를 잡아냅니다:
> Projects should use relative imports to import from other files within the same project.

VSCode 저장 시 자동으로 `@admin-api/src/...` → `./...` 또는 `../...`로 fix됩니다.

### 2) 같은 lib 안 → 상대경로

```ts
// ✅ libs/core-domain/src/support/formatter/FormatCurrencyAmount.ts
import { CurrencyCodeUnion } from '../../../../core-enum/src/currency/Currency.enum';
//                                  ↑ 같은 워크스페이스(libs/core-domain) 안이면 상대경로
```

> ⚠️ **그러나** lib 간 참조(`core-domain → core-enum`)는 **다른 워크스페이스**라 절대경로가 맞습니다 (아래 4번 참조). 위 예시는 잘못된 패턴 — 헷갈리니 다음 항목 참고.

### 3) `apps/*` → `libs/*` (앱이 lib 참조) → 절대경로

```ts
// ✅ apps/admin-api/src/support/exception/AdminApiExceptionFilter.ts
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

// ❌
import { CoreDomainError } from '../../../../../libs/core-domain/src/support/error/CoreDomainError';
```

### 4) `libs/*` → 다른 `libs/*` (lib 간 참조) → 절대경로

```ts
// ✅ libs/core-domain/src/support/formatter/FormatCurrencyAmount.ts
import { CurrencyCodeUnion } from '@libs/core-enum/src/Currency.enum';

// ❌ 상대경로로 다른 lib 들어가지 않기
import { CurrencyCodeUnion } from '../../../../core-enum/src/Currency.enum';
```

레이어 간 의존성 규칙은 `eslint.config.mjs`의 `depConstraints`로 강제됩니다:
- `layer:domain` → `database`, `enum`, `contract` 참조 가능
- `layer:database` → `enum`만
- `layer:contract` → `enum`만
- `layer:enum` → 아무것도 참조 안 함

### 5) 앱 간 참조 → 금지

```ts
// ❌ admin-api 코드에서 core-api 내부를 import하면 안 됨
import { Foo } from '@core-api/src/...';
```

ESLint가 `scope:app` 태그 기반으로 차단합니다. 공유가 필요하면 `libs/`로 추출하세요.

---

## Import 정렬 (`import/order`)

ESLint가 자동 정렬합니다. 그룹 순서:

1. `builtin` (예: `crypto`, `fs`)
2. `external` (예: `@nestjs/*` 우선, 그 외 npm 패키지)
3. `internal`:
  - `@admin-api/*`
  - `@core-api/*`
  - `@batch/*`
  - `@libs/*`
4. `parent` (`../...`)
5. `sibling` (`./...`)
6. `index` / `type`

각 그룹 사이엔 빈 줄 1개. 그룹 내부는 알파벳 순.

```ts
// 표준 순서
import { randomUUID } from 'crypto';

import { Catch, HttpException } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import dayjs from 'dayjs';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminApiError } from '../error/AdminApiError';
import { AdminApiResponse } from '../response/AdminApiResponse';

import { localHelper } from './helpers';
```

---

## 트러블슈팅

### Q. VSCode 저장하면 `@admin-api/src/...`가 `./...`로 자동 변경됨
정상 동작입니다. 같은 워크스페이스 안에서는 상대경로가 맞습니다. 그대로 두세요.

### Q. `@libs/...`가 `../../../libs/...`로 자동 변경됨
정상 동작이 **아닙니다**. 다른 워크스페이스 참조는 절대경로로 유지되어야 합니다. 다음을 확인:
1. 가져오려는 파일이 정말 `libs/` 하위에 있는지
2. `tsconfig.base.json`의 `paths`에 해당 alias가 정의돼 있는지
3. `apps/<app>/.swcrc`에도 같은 alias가 미러링돼 있는지

### Q. ESLint가 `Cannot find module '@libs/...'` 에러
1. `tsconfig.base.json`의 `paths`에 alias 정의 누락 → 추가
2. lib 폴더의 `tsconfig.lib.json`이 자체 `paths`를 정의해서 base를 덮어쓰는지 확인 → 자체 paths 제거

### Q. 새 lib 추가했는데 alias가 안 잡힘
체크리스트:
1. `tsconfig.base.json`의 `paths`에 `@libs/<new-lib>/*: ["libs/<new-lib>/*"]` 추가
2. `apps/admin-api/.swcrc`, `apps/core-api/.swcrc`의 `paths`에도 동일하게 추가
3. `eslint.config.mjs`의 `import/order` `pathGroups`에 패턴 추가 (정렬 규칙용)
4. lib의 `package.json`에 적절한 `nx.tags` (`scope:shared`, `layer:*`) 설정

### Q. ESLint가 `The "<project>" project uses the following packages, but they are missing from "dependencies"` 에러
**증상:** lib에서 다른 lib을 import했더니 `@nx/dependency-checks` 규칙이 의존성 누락 에러를 띄움. VSCode에서 저장하면 자동으로 `"@nx-nest-starter/<lib>": "0.0.1"`처럼 하드코딩된 버전이 추가됨.

**원인:** nx가 import 그래프를 분석해서 의존성 명시를 강제하는 규칙. 워크스페이스 내부 lib 참조도 `package.json`의 `dependencies`에 선언돼 있어야 함 (배포 시 정확한 dist `package.json` 생성, publish 시 의존성 명세 정확성을 위해).

**해결:** 의존성 추가는 맞지만, 자동 추가된 **하드코딩 버전을 `workspace:*`로 바꿔야 합니다.**

```diff
"dependencies": {
- "@nx-nest-starter/core-enum": "0.0.1"
+ "@nx-nest-starter/core-enum": "workspace:*"
}
```

**`workspace:*`의 의미:**
- pnpm 모노레포 내부 패키지 자동 링크
- 항상 최신 워크스페이스 버전 사용 — core-enum 버전 올라도 수정 불필요
- 외부 publish 시 pnpm이 자동으로 concrete 버전으로 변환

**버전 표기 컨벤션 요약:**

| 패키지 종류 | 표기 |
|---|---|
| 외부 npm 패키지 | `"catalog:"` (pnpm catalog protocol) |
| 워크스페이스 내부 lib | `"workspace:*"` |
| ❌ 하드코딩(`"0.0.1"`) | `"workspace:*"`로 교체 |

→ VSCode가 `"0.0.1"`로 자동 추가하면 수동으로 `"workspace:*"`로 바꿔주세요.

### Q. 새 lib 만들고 import했는데 `A project without tags matching at least one constraint cannot depend on any libraries` 에러
**증상:** `package.json`에 태그를 정상적으로 넣었는데도 ESLint가 위 메시지로 import를 막음.

**원인:** nx의 ProjectGraph 캐시가 stale. 새 프로젝트 또는 변경된 `nx.tags`가 ESLint 서버에 아직 반영되지 않은 상태. CLI에서 `npx eslint ...`는 통과해도 VSCode/Cursor에서는 빨간 줄이 남아있음.

**해결:**

| 환경 | 조치 |
|---|---|
| **VSCode / Cursor** | `Cmd+Shift+P` → **"ESLint: Restart ESLint Server"** |
| **CLI** | `npx nx reset` (nx daemon 종료) 후 명령 재실행, 또는 `npx nx graph` 한 번 실행해서 그래프 재생성 |

**검증:** 의심되면 `npx nx graph --file=/tmp/g.json`으로 그래프 덤프 떠서 새 lib 노드의 `tags` 필드가 제대로 들어있는지 확인 가능.

> 일반적인 import 추가는 자동 갱신되지만, **새 프로젝트 추가 / `nx.tags` 변경**처럼 메타데이터가 바뀌는 경우에는 한 번 재시작 필요.

---

## 새 path alias 추가 체크리스트

새 워크스페이스(`apps/` 또는 `libs/`)를 추가할 때 갱신해야 할 파일:

- [ ] `tsconfig.base.json` → `paths` 항목 추가
- [ ] `apps/<app>/.swcrc` → `paths` 미러링 (양쪽 앱 모두)
- [ ] `eslint.config.mjs` → `import/order`의 `pathGroups`에 패턴 추가
- [ ] 새 lib이면 `package.json`에 `nx.tags` 설정 (모듈 경계 적용)
- [ ] `nx build <project>` 1회 실행 → sync 프롬프트에 "Yes" → `references` 자동 동기화
  - (수동 편집 X. nx가 import 그래프 보고 알아서 채워줌)

---

## Lib에서 다른 lib 참조 시 `TS6059` 에러 (rootDir)

**증상:**
```
TS6059: '...libs/core-enum/src/Currency.enum.ts' 파일이 'rootDir'
'...libs/core-domain/src' 아래에 있지 않습니다.
```

**원인:** lib의 `tsconfig.lib.json`이 base에서 상속받은 `composite: true` + 자체 `rootDir: "src"` 조합을 갖는데, `@libs/<other-lib>/src/...` import가 다른 워크스페이스의 source 파일을 가리켜서 rootDir 제약을 위반.

**해결:** cross-lib import를 갖는 lib의 `tsconfig.lib.json`에서:
1. `rootDir` 제거
2. `composite: false` 추가
3. `declaration: true`, `declarationMap: false` 추가 (base의 `emitDeclarationOnly: true`와 호환되도록)

> 📌 **`references`는 직접 손대지 마세요.** nx의 sync generator(`@nx/js:typescript-sync`)가 import 그래프를 분석해서 `tsconfig.json`(루트), `apps/*/tsconfig.app.json`, `libs/*/tsconfig.lib.json`의 `references`를 자동으로 동기화합니다. `nx build` 실행 시 "The workspace is out of sync" 프롬프트가 뜨면 **"Yes, sync"** 선택하면 됩니다. 매번 묻지 않게 하려면 `nx.json`에 `"sync": { "applyChanges": true }` 추가.

**적용 예시 (`libs/core-domain/tsconfig.lib.json`):**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist/libs/core-domain",
    "tsBuildInfoFile": "../../dist/libs/core-domain/tsconfig.lib.tsbuildinfo",
    "types": ["node"],
    "composite": false,
    "declaration": true,
    "declarationMap": false
  },
  "include": ["src/**/*.ts"],
  "exclude": [...],
  "references": []
}
```

**참고:** leaf lib(다른 lib을 참조하지 않는 lib, 예: 현 시점의 `core-enum`)은 composite 유지해도 무방. cross-lib import가 추가되는 시점에 위 fix를 적용.
