# 트러블슈팅

이 스킬을 수행하면서 자주 마주치는 문제와 해결 방법입니다.

## 목차

1. 재귀 catalog 항목 복구 (`ERR_PNPM_CATALOG_ENTRY_INVALID_RECURSIVE_DEFINITION`)
2. workspace 패키지를 catalog로 잘못 등록한 경우
3. catalog에 있는데 `Cannot find module` 에러
4. `pnpm why`가 여러 버전을 보여주는 경우
5. ESLint `@nx/dependency-checks` 에러
6. 타입 정의 패키지(@types/*)가 인식되지 않음
7. `chokidar` 같은 optional dependency 누락

---

## 1. 재귀 catalog 항목 복구

### 증상

```
 ERR_PNPM_CATALOG_ENTRY_INVALID_RECURSIVE_DEFINITION
 Found invalid catalog entry using the catalog protocol recursively.
 The entry for 'XXX' in catalog 'default' is invalid.
```

### 원인

`pnpm-workspace.yaml`의 catalog 항목이 자기 자신을 참조하고 있습니다:

```yaml
catalog:
  ts-jenum: catalog:        # ❌ 잘못된 자기 참조
  helmet: catalog:^8.0.0    # ❌ 잘못된 자기 참조 (값이 catalog:로 시작)
```

이런 상태가 만들어지는 흔한 시나리오:
- 자동화 스크립트가 이미 `"catalog:"`로 설정된 패키지의 버전을 다시 catalog에 저장
- 수동 편집 중 실수
- yaml 파서 버그

### 진단

```bash
# 망가진 항목 검색
grep -nE ':\s*catalog:' pnpm-workspace.yaml
```

`packages: ...` 같이 정상적인 줄도 잡힐 수 있으니, **catalog 섹션 안에서** 값이 `catalog:`로 시작하는 줄을 식별합니다.

### 복구

1. **각 망가진 항목의 실제 버전 확인**:
   ```bash
   pnpm view <패키지명> version
   # 또는 다른 정상 프로젝트의 lockfile에서 확인
   pnpm list <패키지명> --depth=Infinity
   ```

2. **`pnpm-workspace.yaml` 직접 편집**:
   ```yaml
   # Before
   catalog:
     ts-jenum: catalog:

   # After (실제 버전으로)
   catalog:
     ts-jenum: ^2.0.0
   ```

3. **재설치로 검증**:
   ```bash
   pnpm install
   ```

   에러가 사라지면 복구 성공.

### 예방

스크립트나 자동화 도구에서 catalog에 등록할 버전 값이 다음 패턴이면 거부:
- `^catalog:` 또는 정확히 `catalog:`
- `^workspace:` 또는 정확히 `workspace:*`

---

## 2. workspace 패키지를 catalog로 잘못 등록

### 증상

```yaml
catalog:
  '@nx-nest-starter/core-domain': workspace:*    # ❌
```

### 원인

내부 라이브러리(`@nx-nest-starter/core-domain` 등)는 catalog가 아니라 `workspace:*` 프로토콜로 직접 참조해야 합니다. 자동화 스크립트가 이를 구분하지 못해 잘못 등록한 경우.

### 복구

`pnpm-workspace.yaml`에서 해당 항목 **삭제**:

```yaml
catalog:
  # workspace 패키지는 여기 있으면 안 됨
  '@nx-nest-starter/core-domain': workspace:*    # ← 이 줄 삭제
```

각 프로젝트의 `package.json`에서는 다음과 같이 직접 `workspace:*`로 참조:

```json
"dependencies": {
  "@nx-nest-starter/core-domain": "workspace:*"
}
```

---

## 3. catalog에 있는데 `Cannot find module` 에러

### 증상

```
Error: Cannot find module 'helmet'
```

`pnpm-workspace.yaml`에는 `helmet: ^8.0.0`이 있고, `package.json`에도 `"helmet": "catalog:"`가 있는데 모듈을 못 찾음.

### 원인 후보

1. `pnpm install`을 안 함
2. `node_modules`가 오래됨
3. `pnpm-lock.yaml`과 `pnpm-workspace.yaml`이 어긋남

### 해결

```bash
# 1. 캐시 초기화 + 재설치
rm -rf node_modules
pnpm install

# 2. Nx 사용 중이면 Nx 캐시도
nx reset
```

---

## 4. `pnpm why`가 여러 버전을 보여줌

### 증상

```bash
$ pnpm why typeorm

apps/admin-api
└── typeorm 0.3.20

libs/core-database
└── typeorm 0.3.18    # ← 다른 버전!
```

### 원인

일부 프로젝트는 catalog를 통해 참조하지만, 다른 프로젝트는 직접 버전을 명시하고 있음.

### 진단

```bash
# 모든 package.json에서 해당 패키지가 어떻게 참조되는지 확인
grep -rE '"typeorm":\s*"[^"]+' apps libs
```

결과 예시:
```
apps/admin-api/package.json:    "typeorm": "catalog:"          ✓
libs/core-database/package.json: "typeorm": "^0.3.18"         ✗ 직접 버전
```

### 해결

직접 버전을 쓰는 곳들을 모두 `"catalog:"`로 바꾸고:

```bash
pnpm install
```

---

## 5. ESLint `@nx/dependency-checks` 에러

### 증상

```
A project tagged with "scope:shared" should declare 
"typeorm" in its dependencies.

@nx/dependency-checks
```

### 원인

라이브러리의 코드에서 `typeorm`을 import하는데, 그 라이브러리의 `package.json`에는 `typeorm`이 선언되어 있지 않음.

### 해결

해당 라이브러리의 `package.json`에 의존성 추가:

```json
{
  "name": "@nx-nest-starter/core-database",
  "dependencies": {
    "typeorm": "catalog:"
  }
}
```

이 스킬을 사용해 추가하려면, 해당 라이브러리를 대상으로 지정해서 추가하면 됩니다.

---

## 6. 타입 정의 패키지(@types/*)가 인식되지 않음

### 증상

```typescript
import { Request, Response } from 'express';
//          ^^^^^^^^^^^^^^^
// 'express' 모듈 또는 해당 형식 선언을 찾을 수 없습니다.
```

### 원인

런타임 패키지(`express`)는 NestJS의 `@nestjs/platform-express`가 의존성으로 끌고 와서 존재하지만, **타입 정의(`@types/express`)는 자동 설치되지 않음**.

### 해결

`@types/*` 패키지를 **devDependencies**로 추가:

이 스킬 사용 시:
- 대상: 해당 앱들 (admin-api, core-api 등)
- 타입: `devDependencies`
- 패키지: `@types/express`

흔히 같이 필요한 타입 패키지들:
- `@types/express`
- `@types/cookie-parser`
- `@types/morgan`
- `@types/lodash`

자체 타입 내장이라 `@types/*`가 불필요한 패키지:
- `@nestjs/*` 전부
- `dayjs`
- `nestjs-i18n`
- `class-validator`, `class-transformer`
- `typeorm`
- `helmet` (v5+)

---

## 7. `chokidar` 같은 optional dependency 누락

### 증상

```
The optional dependency chokidar is not installed and is required for --watch.
Error: Cannot find module 'chokidar'
```

### 원인

pnpm v10+는 일부 optional dependency를 기본으로 설치하지 않습니다. SWC의 watch 모드 등이 필요한 경우 명시적으로 설치 필요.

### 해결

이 스킬을 사용해 루트(전역 도구) 또는 해당 앱에 추가:
- `chokidar` → 보통 루트 `devDependencies` (모든 앱이 watch 시 사용)

루트에 직접 설치:
```bash
pnpm add -D -w chokidar
```

---

## 8. pnpm 빌드 스크립트 차단 경고

### 증상

```
Ignored build scripts: @swc/core, nx, @parcel/watcher.
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

### 원인

pnpm v10+는 보안상 모든 postinstall 스크립트를 기본 차단. SWC 같은 네이티브 바이너리가 필요한 패키지는 명시적 승인 필요.

### 해결

루트 `package.json`에 추가:

```json
{
  "pnpm": {
    "onlyBuiltDependencies": [
      "@swc/core",
      "nx",
      "unrs-resolver",
      "@parcel/watcher"
    ]
  }
}
```

새 네이티브 패키지가 추가될 때마다 이 목록에 신뢰할 수 있는지 확인 후 추가.

---

## 일반 검증 체크리스트

작업 후 다음을 항상 확인:

```bash
# 1. catalog 무결성
grep -E ':\s*catalog:\s*$' pnpm-workspace.yaml && echo "재귀 발견!" || echo "OK"

# 2. 동일 패키지의 단일 버전 사용
pnpm why <패키지명>

# 3. 빌드 정상 동작
nx build <대상앱>

# 4. Lint 통과
nx run-many -t lint
```