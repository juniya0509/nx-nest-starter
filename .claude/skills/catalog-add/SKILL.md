---
name: catalog-add
description: pnpm 모노레포 워크스페이스에서 Catalog 프로토콜을 사용하여 npm 패키지를 일괄 추가하고 동기화합니다. 사용자가 "패키지 추가", "패키지 설치", "catalog에 추가", "@nx-nest-starter에 패키지 깔아줘", "admin-api에 helmet 설치", "core-api랑 admin-api 둘 다에 의존성 추가", "이 라이브러리 어디에 깔아야 해?", "타입 패키지 설치", "devDependencies 추가" 같은 요청을 할 때 반드시 이 스킬을 사용하세요. pnpm-workspace.yaml의 catalog 섹션과 각 프로젝트의 package.json을 자동으로 동기화하며, 이미 catalog에 있는 패키지의 재귀 참조 같은 함정을 방지합니다. NestJS/Nx 모노레포, pnpm catalog 프로토콜, 워크스페이스 의존성 관리와 관련된 모든 작업에서 이 스킬을 우선적으로 활용하세요.
---

# Catalog Add — pnpm Catalog 패키지 추가 자동화

pnpm 모노레포에서 `catalog:` 프로토콜을 사용해 패키지를 추가/동기화하는 작업을 자동화합니다.

## 이 스킬을 사용해야 하는 상황

다음 같은 요청을 받으면 이 스킬을 사용하세요:

- "admin-api에 helmet 추가해줘"
- "@types/express를 admin-api랑 core-api 둘 다에 깔아줘"
- "core-domain 라이브러리에 zod 추가"
- "typeorm을 catalog로 관리하게 해줘"
- "여러 라이브러리에 같은 패키지 한 번에 설치"
- "이미 catalog에 있는 패키지를 다른 프로젝트에도 적용"
- "devDependencies로 타입 패키지 추가"

## 핵심 원칙

이 스킬이 동작하는 모노레포의 구조 가정:

```
프로젝트 루트/
├── apps/                          # 애플리케이션 (배포 단위)
│   ├── admin-api/package.json
│   └── core-api/package.json
├── libs/                          # 공유 라이브러리
│   ├── core-enum/package.json
│   ├── core-domain/package.json
│   └── core-database/package.json
├── pnpm-workspace.yaml            # catalog 정의
└── scripts/catalog-add.mjs        # (선택) 자동화 스크립트
```

각 프로젝트의 `package.json`은 `dependencies`/`devDependencies`에서 `"catalog:"` 프로토콜로 버전을 참조하고, 실제 버전은 `pnpm-workspace.yaml`의 `catalog:` 섹션에서 단일 관리됩니다.

## 작업 절차

### 1단계: 사용자 의도 파악

다음 정보를 사용자에게 확인하세요. 한 번에 모두 묻기보다 자연스럽게 대화로 끌어내세요:

1. **어떤 프로젝트(들)에 설치?** (예: `admin-api`, `core-domain`, 또는 "모든 apps")
2. **dependencies인가 devDependencies인가?** (런타임 vs 개발 도구/타입)
3. **어떤 패키지?** (이름과, 가능하면 정확한 버전)

대화 맥락에서 이미 답이 나와 있으면 다시 묻지 마세요. 예를 들어 사용자가 "main.ts에서 helmet을 쓰려는데..."라고 말했다면 → admin-api/core-api의 dependencies에 helmet이 필요한 게 명백합니다.

### 2단계: 사전 검증

설치를 시작하기 전에 **반드시** 다음을 확인합니다:

#### 2-1. 워크스페이스 구조 확인

```bash
ls pnpm-workspace.yaml
ls apps/ libs/
```

`pnpm-workspace.yaml`이 없거나 `packages:` 항목에 `apps/*`, `libs/*`가 없으면 이 스킬의 가정과 다른 구조이므로 사용자에게 확인하세요.

#### 2-2. catalog 무결성 검증 (매우 중요)

`pnpm-workspace.yaml`의 `catalog` 섹션에 **자기 참조 항목**이 있는지 확인:

```bash
# 잘못된 항목: 값이 "catalog:"로 끝남 (자기 참조 → 무한 재귀)
grep -E ':\s*catalog:\s*$' pnpm-workspace.yaml || echo "OK"
```

만약 다음 같은 항목이 발견되면 **즉시 중단**하고 사용자에게 알립니다:

```yaml
catalog:
  ts-jenum: catalog:    # ❌ 자기 참조
```

이건 이전에 잘못 저장된 값이며, 그대로 두고 설치를 진행하면 `ERR_PNPM_CATALOG_ENTRY_INVALID_RECURSIVE_DEFINITION` 에러가 납니다. `pnpm view <패키지명> version`으로 실제 버전을 확인한 뒤 손으로 수정해야 합니다.

자세한 복구 방법은 `references/troubleshooting.md`의 "재귀 catalog 항목 복구" 섹션을 참고하세요.

#### 2-3. 입력 패키지 분류

사용자가 추가하려는 각 패키지를 두 그룹으로 나눕니다:

- **Group A: 이미 catalog에 있는 패키지** → 추가 설치 불필요, 각 프로젝트 `package.json`에 `"catalog:"` 참조만 추가하면 됨
- **Group B: 새 패키지** → 임시 설치로 버전 확인 후 catalog에 등록

이 분리가 핵심입니다. Group A를 그냥 `pnpm add`로 설치하면 catalog 자기 참조 에러가 발생합니다.

### 3단계: 설치 실행

#### 3-1. Group B (새 패키지) 임시 설치

대상 프로젝트 중 **하나**에만 임시 설치해서 버전을 결정합니다:

```bash
pnpm add [-D] --filter <첫번째_대상_pkgName> <pkg1> <pkg2> ...
```

- `-D`는 devDependencies일 때
- `<첫번째_대상_pkgName>`은 `package.json`의 `name` 필드 (예: `@nx-nest-starter/admin-api`)
- 임시로 한 프로젝트에만 설치하는 이유: 버전만 알면 되고, 모든 대상에 설치하면 자기 참조 위험

#### 3-2. 설치된 버전 추출 및 검증

`<첫번째_대상>/package.json`을 읽어서 방금 설치된 버전을 확인합니다.

**다음 값들은 반드시 거부**:
- `"catalog:"` 또는 `"catalog:..."` → 자기 참조 (이미 catalog 참조로 설정된 패키지일 수 있음)
- `"workspace:*"` 또는 `"workspace:..."` → 워크스페이스 패키지는 catalog로 관리하면 안 됨

이런 값이 감지되면 **중단**하고 사용자에게 `pnpm view <패키지명> version`으로 실제 버전을 확인하도록 안내합니다.

#### 3-3. pnpm-workspace.yaml에 catalog 등록

새 패키지의 버전을 `pnpm-workspace.yaml`의 `catalog:` 섹션에 추가합니다. 기존 항목은 보존합니다.

```yaml
catalog:
  # ... 기존 항목들
  helmet: ^8.0.0           # 새로 추가
  cookie-parser: ^1.4.7    # 새로 추가
```

YAML 편집 시 들여쓰기와 따옴표 규칙(스코프 패키지 `'@nestjs/common'`은 따옴표 필요)에 주의하세요.

#### 3-4. 모든 대상의 package.json 업데이트

대상 프로젝트들 각각의 `package.json`에서 해당 패키지를 `"catalog:"` 참조로 설정합니다:

```json
{
  "dependencies": {
    "helmet": "catalog:",
    "cookie-parser": "catalog:"
  }
}
```

Group A(이미 catalog에 있던 것)도 이 단계에서 동일하게 처리합니다.

#### 3-5. 최종 동기화

```bash
pnpm install
```

이 단계에서 워크스페이스 전체가 catalog 버전으로 정렬됩니다.

### 4단계: 검증

설치 완료 후 다음을 확인합니다:

```bash
# 1. 모든 대상이 동일 버전을 사용하는지
pnpm why <패키지명>

# 2. catalog에 정상 등록됐는지
grep -A 1 '<패키지명>' pnpm-workspace.yaml

# 3. 빌드가 깨지지 않았는지 (선택)
nx build <대상앱>
```

## 자동화 스크립트 사용

이 스킬은 두 가지 모드로 동작합니다:

### 모드 A: 스크립트 실행 (권장, 프로젝트에 스크립트 있을 때)

프로젝트에 `scripts/catalog-add.mjs`가 이미 있고 `package.json`에 `catalog:add` 스크립트가 등록되어 있으면, 그 스크립트를 사용합니다. 다만 인터랙티브 프롬프트라 비대화형 환경에서는 사용 어려움.

```bash
# 사용자가 직접 실행하도록 안내
pnpm catalog:add
```

### 모드 B: 직접 수행 (스크립트 없거나 비대화형 환경)

위 3단계 절차를 직접 수행합니다. 이 경우 `references/manual-procedure.md`에 더 상세한 단계와 실수 사례가 정리되어 있으니 참고하세요.

### 모드 C: 스크립트 신규 생성

프로젝트에 `scripts/catalog-add.mjs`가 없는데 사용자가 자동화 스크립트를 원하면, `scripts/catalog-add.mjs` 파일을 이 스킬의 `assets/catalog-add.mjs` 템플릿을 기반으로 생성해줍니다. 자세한 내용은 `assets/catalog-add.mjs`를 참조하세요.

## 자주 발생하는 문제

해결 방법은 `references/troubleshooting.md`에 정리되어 있습니다. 다음 증상이 보이면 해당 파일을 먼저 읽으세요:

- `ERR_PNPM_CATALOG_ENTRY_INVALID_RECURSIVE_DEFINITION`
- `Cannot find module '@nx-nest-starter/...'`
- `pnpm install`은 성공했는데 `pnpm why`가 여러 버전을 보여줌
- 라이브러리에서 import는 되는데 lint에서 `@nx/dependency-checks` 에러

## 출력 형식

작업이 끝나면 사용자에게 다음 형식으로 결과를 요약합니다:

```
✅ 완료

추가된 패키지:
- helmet ^8.0.0 → catalog 신규 등록
- cookie-parser ^1.4.7 → catalog 신규 등록

적용된 프로젝트:
- apps/admin-api (dependencies)
- apps/core-api (dependencies)

검증:
- pnpm install 통과
- pnpm why helmet 단일 버전 확인
```

## 안전 원칙

1. **catalog 무결성 우선** — 작업 시작 전 항상 사전 검증
2. **임시 설치는 한 프로젝트에만** — 자기 참조 에러 방지
3. **잘못된 버전 값은 즉시 중단** — `catalog:`/`workspace:` 값 거부
4. **사용자 확인** — 여러 프로젝트에 동시 적용할 때는 한 번 더 보여주고 확인
5. **롤백 가능 상태 유지** — 작업 중 큰 실수가 감지되면 git 상태로 되돌릴 수 있게 안내