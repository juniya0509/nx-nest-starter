---
name: git-commit
description: 개발 내용을 git에 커밋하는 워크플로우. 변경 파일을 작업 성격별로 **여러 커밋으로 분리**하고 프로젝트 컨벤션 prefix(`[Feature]`/`[Fix]`/`[Refactor]`/`[Docs]`/`[Chore]` 등)에 맞춰 메시지 작성, **반드시 사용자 승인 후 커밋** 실행. "커밋해줘", "지금까지 작업 커밋", "이거 커밋" 등 커밋 요청 시 사용.
---

# 커밋 워크플로우

> ⚠️ **절대 사용자 승인 없이 커밋을 실행하지 않습니다.** 메시지와 스테이징 파일을 제시하고 승인받은 뒤에만 커밋합니다.

## 1단계: 현재 상태 파악

아래 명령을 **병렬**로 실행해 변경사항을 수집합니다.

- `git status` — 변경/신규 파일 목록 (⚠️ `-uall` 금지)
- `git diff` — unstaged 변경 내용
- `git diff --staged` — 이미 staged된 변경 (있는 경우)
- `git log --oneline -10` — 최근 커밋 스타일 참고

## 2단계: 작업 단위로 분리

**하나의 커밋에 여러 성격을 섞지 않습니다.** 변경사항을 아래 기준으로 그룹핑합니다.

### 컨벤션 Prefix

| Prefix | 대상 |
| - | - |
| `[Feature]` | 기능 추가 (기능 단위의 신규 구현) |
| `[Add]` | 단순 추가 (기능 단위가 아닌 부분적 추가 — 로깅·에러 처리·유틸·에셋 등) |
| `[Fix]` | 기능 수정 |
| `[Hotfix]` | 운영 중 버그 수정 |
| `[Refactor]` | 코드 구조 개선 (동작 변화 없음) |
| `[Test]` | 테스트 추가/수정 |
| `[Comment]` | 주석 추가/수정 |
| `[Lint]` | 코드 스타일 수정 (lint/formatter) |
| `[Rename]` | 파일/폴더 이름 변경 |
| `[Remove]` | 파일/폴더 삭제 |
| `[Docs]` | 문서 추가/수정 (국제화 번역 문서 포함) |
| `[Chore]` | 빌드/패키지 설정 등 기타 |

### 그루핑 예시
- `CLAUDE.md`, `.claude/skills/**`, `.claude/docs/**` 변경 → `[Docs]` 1커밋
- `apps/core-api/src/controller/**` + `src/domain/**` 신규 파일 → `[Feature]` 1커밋
- `package.json` + `pnpm-lock.yaml` + `.gitignore` → `[Chore]` 별도 커밋
- 기존 API 로직 수정 → `[Fix]` 별도 커밋
- 위 변경들이 한 작업 세션에 섞여 있어도 **4개 커밋으로 분리**합니다.

**그루핑이 애매하면 사용자에게 먼저 확인합니다.**

## 3단계: 커밋 계획 제시 → 사용자 승인 대기

각 커밋 계획을 아래 형식으로 묶어 제시합니다.

```
### Commit 1
**Message:** [Feature] 유저 회원가입 API 추가
**Files:**
- apps/core-api/src/controller/user/UserController.ts
- apps/core-api/src/domain/user/User.service.ts
- apps/core-api/src/domain/user/data/CreateUserData.ts

### Commit 2
**Message:** [Chore] dayjs 패키지 추가
**Files:**
- apps/core-api/package.json
- pnpm-lock.yaml
```

사용자가 **"진행", "OK", "그대로 커밋" 등 명시적으로 승인**할 때까지 실행하지 않습니다.

- 수정 요청 시 메시지·파일 그룹을 재작성해 다시 제시.
- 부분 승인(예: "1번만 먼저")도 허용 — 승인된 것만 진행.

## 4단계: 스테이징 + 커밋 실행

승인이 떨어진 커밋부터 **순차적으로** 실행합니다.

- **반드시 파일 단위로 add.** `git add -A`, `git add .`, `git add -u` 금지 (의도치 않은 파일 포함 방지).
- `.env*`, credentials, 대용량 바이너리는 커밋 대상에서 **자동 제외**.

```bash
git add apps/core-api/src/controller/user/UserController.ts apps/core-api/src/domain/user/User.service.ts ...
git commit -m "[Feature] 유저 회원가입 API 추가"
```

본문이 필요한 커밋은 HEREDOC 사용:

```bash
git commit -m "$(cat <<'EOF'
[Feature] 유저 회원가입 API 추가

- CreateUserReq DTO 추가
- User.service 구현 + CreateUserData 클래스
EOF
)"
```

## 5단계: 결과 확인

- `git status` — 남은 변경이 있는지 확인 (다음 커밋 계획과 일치하는지).
- `git log --oneline -N` — 만든 N개 커밋이 기대한 메시지로 있는지 확인.
- 사용자에게 **결과 요약 + 남은 변경 목록** 전달.

## 금지 사항

- ❌ **사용자 승인 없이 커밋 실행.**
- ❌ `git add -A`, `git add .` 등 포괄 스테이징.
- ❌ `--no-verify`, `--no-gpg-sign`, `--amend` (사용자가 **명시적으로 요청한 경우에만** 허용).
- ❌ 여러 성격의 변경을 하나의 커밋에 섞기.
- ❌ 사용자의 명시적 요청 없이 `git push` 실행.
- ❌ 컨벤션 목록에 없는 prefix 사용 (임의의 `[Update]`, `[Change]` 등 금지).
