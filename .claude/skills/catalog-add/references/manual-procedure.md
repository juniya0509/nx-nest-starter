# 수동 절차 상세 가이드

스크립트 없이 catalog에 패키지를 추가할 때의 단계별 절차입니다. 비대화형 환경(CI, 자동화 등)이나 스크립트가 동작하지 않는 상황에서 사용합니다.

## 전체 플로우

```
1. 사전 검증
   ├─ pnpm-workspace.yaml 무결성 확인
   ├─ 입력 패키지를 "이미 catalog에 있음" / "새 패키지" 분리
   └─ 잘못된 자기참조 항목 있으면 중단

2. 새 패키지만 임시 설치
   ├─ 첫 번째 대상 프로젝트에만 설치 (버전 확인용)
   └─ 설치된 버전 추출 + 검증 (catalog:/workspace: 거부)

3. catalog 등록
   └─ pnpm-workspace.yaml의 catalog 섹션에 추가

4. 모든 대상의 package.json 업데이트
   └─ "패키지명": "catalog:" 로 설정

5. pnpm install
   └─ 워크스페이스 전체 동기화

6. 검증
   ├─ pnpm why로 단일 버전 확인
   └─ 빌드/lint 통과 확인
```

## 단계별 상세

### Step 1: 사전 검증

#### 1-1. pnpm-workspace.yaml 읽기

```bash
cat pnpm-workspace.yaml
```

`packages` 항목과 `catalog` 항목이 정상 있어야 함.

#### 1-2. 자기참조 항목 검사

```bash
# catalog 섹션 안에서 값이 "catalog:"로 시작하거나 정확히 "catalog:"인 항목
grep -E "^\s+[^:]+:\s*catalog:" pnpm-workspace.yaml
```

매칭되는 줄이 있으면 **즉시 중단**하고 `references/troubleshooting.md`의 "재귀 catalog 항목 복구" 섹션 참고.

#### 1-3. 입력 패키지 분류

각 패키지에 대해 catalog에 이미 있는지 확인:

```bash
# 예: helmet이 catalog에 있는지
grep -E "^\s+helmet:" pnpm-workspace.yaml
```

또는 yaml을 파싱해서 `catalog` 객체의 키를 확인.

분류 결과:
- **Group A (이미 있음)**: 임시 설치 불필요
- **Group B (새 패키지)**: 임시 설치 필요

### Step 2: 새 패키지 임시 설치

#### 2-1. 임시 설치 실행

`Group B`만, **첫 번째 대상 프로젝트에만** 설치:

```bash
# dependencies인 경우
pnpm add --filter <첫번째_pkgName> <pkg1> <pkg2> ...

# devDependencies인 경우  
pnpm add -D --filter <첫번째_pkgName> <pkg1> <pkg2> ...
```

`<첫번째_pkgName>`은 `apps/admin-api/package.json`의 `name` 필드 (예: `@nx-nest-starter/admin-api`).

**여러 프로젝트에 동시 설치하지 않는 이유**: 다른 프로젝트들이 이미 catalog 참조 상태일 수 있고, 그 경우 자기참조 에러가 발생할 수 있음.

#### 2-2. 설치된 버전 확인

방금 설치한 프로젝트의 `package.json`을 읽어서 버전 추출:

```bash
cat apps/admin-api/package.json
```

각 새 패키지의 버전이 어떻게 들어갔는지 확인:

```json
"dependencies": {
  "helmet": "^8.0.0"     ← 추출
}
```

#### 2-3. 잘못된 버전 거부

다음 값이 추출되면 **중단**:

| 값 패턴 | 의미 | 조치 |
|---|---|---|
| `catalog:` 정확히 | 이미 catalog 참조였음 | 사용자에게 catalog 무결성 점검 요청 |
| `catalog:^x.y.z` | 자기참조 변형 | 동일 |
| `workspace:*` | 워크스페이스 패키지 | catalog로 관리 부적합, 직접 참조해야 함 |
| `workspace:^x.y.z` | 동일 | 동일 |
| `link:...` | 로컬 링크 | catalog 부적합 |
| `file:...` | 로컬 파일 | catalog 부적합 |

정상 값 패턴: `^x.y.z`, `~x.y.z`, `>=x.y.z` 등 표준 semver 범위.

### Step 3: catalog 등록

`pnpm-workspace.yaml`의 `catalog` 섹션에 새 항목 추가.

#### YAML 편집 시 주의사항

1. **들여쓰기 일관성** (보통 2 spaces)
2. **스코프 패키지는 따옴표 필수**:
   ```yaml
   catalog:
     '@nestjs/common': ^11.0.0    # ✓ 따옴표
     helmet: ^8.0.0               # 따옴표 없어도 OK (스코프 아님)
   ```
3. **버전 값에 특수문자(^, ~, >=)는 따옴표 권장하지만 필수 아님**

#### 편집 방법

YAML 파서를 사용하는 게 가장 안전:

```javascript
import { parse, stringify } from 'yaml';
const ws = parse(readFileSync('pnpm-workspace.yaml', 'utf-8'));
ws.catalog = ws.catalog || {};
ws.catalog['helmet'] = '^8.0.0';
writeFileSync('pnpm-workspace.yaml', stringify(ws));
```

수동 편집 시:
- 알파벳 순 정렬 유지
- 카테고리별 주석 그룹 유지

### Step 4: 모든 대상의 package.json 업데이트

대상 프로젝트들 각각의 `package.json`에서 해당 섹션(`dependencies` 또는 `devDependencies`)에 catalog 참조 추가/변경:

```json
{
  "dependencies": {
    "helmet": "catalog:",
    "cookie-parser": "catalog:"
  }
}
```

Group A (이미 catalog에 있던) 패키지들도 이 단계에서 동일하게 처리. 즉 **대상 프로젝트의 package.json에 해당 패키지가 아예 없으면 추가, 있으면 `"catalog:"`로 통일**.

### Step 5: pnpm install

```bash
pnpm install
```

이 단계에서:
- node_modules가 catalog 버전으로 갱신됨
- pnpm-lock.yaml이 업데이트됨
- 모든 워크스페이스 프로젝트가 동일 인스턴스 참조

에러가 나면 트러블슈팅 reference 참고.

### Step 6: 검증

#### 6-1. 단일 버전 확인

```bash
pnpm why <패키지명>
```

모든 프로젝트가 동일 버전을 참조해야 함.

#### 6-2. 빌드 테스트

```bash
nx build <대상앱>
```

#### 6-3. Lint 검증 (Nx 사용 시)

```bash
nx run-many -t lint
```

`@nx/dependency-checks` 규칙이 catalog 참조를 정상으로 인식해야 함.

## 흔한 실수

### 실수 1: 모든 대상에 한 번에 임시 설치

```bash
# ❌ 자기참조 에러 위험
pnpm add --filter app1 --filter app2 --filter app3 helmet
```

→ 한 프로젝트에만 임시 설치 후 catalog 등록 → 나머지에 catalog 참조 추가 → `pnpm install` 순으로.

### 실수 2: 임시 설치 후 catalog 등록 잊기

임시 설치만 하고 끝내면, 그 프로젝트는 직접 버전, 다른 프로젝트는 catalog 참조 → 버전 분기.

→ 반드시 catalog 등록 + 임시 설치한 프로젝트의 package.json도 `"catalog:"` 로 변경.

### 실수 3: yaml 들여쓰기 오류

```yaml
catalog:
helmet: ^8.0.0     # ❌ 들여쓰기 없음 (catalog의 자식이 아님)
```

→ 반드시 catalog 안쪽으로 들여쓰기.

### 실수 4: workspace 패키지를 catalog에 등록

```yaml
catalog:
  '@nx-nest-starter/core-domain': workspace:*   # ❌
```

→ 내부 라이브러리는 catalog가 아닌 직접 `workspace:*` 참조.

### 실수 5: scripts/catalog-add.mjs 자동화 스크립트의 함정

이 프로젝트의 scripts/catalog-add.mjs는 다음을 검증해야 함:
- catalog에 이미 있는 패키지는 임시 설치 건너뜀
- 추출된 버전이 `catalog:`/`workspace:`면 거부
- catalog 자체에 자기참조 항목 있으면 시작 전에 중단

이런 검증이 없는 옛 버전 스크립트라면 새 버전(이 스킬의 `assets/catalog-add.mjs`)으로 교체.

## 빠른 참조: 최소 명령어 시퀀스

가장 단순한 케이스: "admin-api에 새 패키지 helmet 추가"

```bash
# 1. 임시 설치
pnpm add --filter @nx-nest-starter/admin-api helmet

# 2. 설치된 버전 확인
grep helmet apps/admin-api/package.json
# "helmet": "^8.0.0"

# 3. pnpm-workspace.yaml에 catalog 항목 추가 (수동 편집 또는 yaml 파서)
# catalog:
#   helmet: ^8.0.0

# 4. apps/admin-api/package.json에서 "catalog:" 로 변경 (수동 편집)
# "helmet": "catalog:"

# 5. 동기화
pnpm install

# 6. 검증
pnpm why helmet
```