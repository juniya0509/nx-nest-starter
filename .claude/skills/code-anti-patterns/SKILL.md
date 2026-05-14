---
name: code-anti-patterns
description: 프로젝트에서 피해야 할 코드 패턴 점검·교체. `any` 타입, `new Date()`(→`dayjs`), `try/catch`(→`neverthrow`), `if/else`(→early return), 레이어 참조 위반(Controller→Implement / Service→Repository 직접 호출 금지), **다중 write 시 `@Transactional()` 필수** 등 확인 시 사용. 타입 선언 위치 상세는 `data-result-convention` skill, import 경로 규칙은 `import-convention` skill, 레이어 규칙 상세는 `.claude/docs/ARCHITECTURE.md` 참고.
---

# 피해야 할 패턴

## 1. `any` 타입 금지
- TypeScript `any` 사용을 피합니다. 구체 타입 또는 제네릭/`unknown` + 타입 가드로 대체합니다.

## 2. `new Date()` 금지 — `dayjs` 사용
```ts
// Bad
const now = new Date();

// Good
import dayjs from 'dayjs';
const now = dayjs();
```

## 3. import 경로 규칙
- **같은 워크스페이스 내부** → 상대경로 (`./...`, `../...`)
- **다른 워크스페이스 참조** (apps → libs, lib 간 참조) → 절대경로 alias (`@libs/...`, `@admin-api/...`, `@core-api/...`)
- 자세한 규칙·트러블슈팅은 `import-convention` skill 참고.

```ts
// ✅ 같은 앱 내부 - 상대경로
import { AdminApiError } from '../error/AdminApiError';

// ✅ apps → libs - 절대경로
import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

// ❌ 같은 앱 내부에서 자기 alias로 절대경로
import { AdminApiError } from '@admin-api/src/support/error/AdminApiError';

// ❌ 다른 워크스페이스를 상대경로로
import { CoreDomainError } from '../../../../../libs/core-domain/src/support/error/CoreDomainError';
```

## 4. `try/catch` 금지 — `neverthrow` 사용
- 예외를 예외 흐름으로 다루지 않고 **`Result<T, E>`** 로 반환합니다.

```ts
import { ok, err, Result } from 'neverthrow';

const parsePositive = (input: number): Result<number, Error> => {
  if (input < 0) return err(new Error('negative'));
  return ok(input);
};
```

## 5. `if/else` 지양 — `if/return` (early return)
```ts
// Bad
if (condition) {
  doA();
} else {
  doB();
}

// Good
if (condition) {
  doA();
  return;
}
doB();
```

## 6. 타입 선언 위치 규칙

- `*.service.ts`, `*.reader.ts` (Implement Layer), `*.repository.ts` 파일 **안에는 타입 선언을 하지 않습니다.**
- `*.service.ts`, `*.reader.ts` → 해당 도메인의 **`data/`, `result/` 폴더에 클래스**로 선언 (`*Data.ts`, `*Result.ts`).
- `*.repository.ts` → 메서드 파라미터에 **inline** 타입으로 작성.

```ts
// Bad — service 파일 안에서 타입 선언
// User.service.ts
type CreateUserProps = { email: string; password: string; };

// Good — data 폴더에 클래스 분리
// user/data/CreateUserData.ts
export class CreateUserData { ... }
```

## 7. 레이어 참조 위반 금지
- Application → Domain → Implementation → Database의 **단방향** 참조만 허용합니다.
- 역방향/동일 레이어 참조/계층 건너뛴 참조는 금지. 예외 사례(Implementation 내부 상호 참조, `batch` 앱의 Database 직접 접근) 및 앱 간 참조 규칙은 **`.claude/docs/ARCHITECTURE.md`** 참고.

### 자주 발생하는 위반 케이스

```ts
// ❌ Bad — Controller가 Implement를 직접 호출 (레이어 건너뛰기)
@Controller()
class XxxController {
  constructor(private readonly xxxReader: XxxReader) {}
  // Controller는 Service만 주입해야 함
}

// ❌ Bad — Service가 Repository를 직접 호출 (레이어 건너뛰기)
@Injectable()
class XxxService {
  constructor(private readonly xxxRepository: XxxRepository) {}
  // Service는 Reader/Creator/Updater/Remover 등 Implement만 주입해야 함
}

// ✅ Good — Controller → Service → Implement → Database 단방향
@Controller()
class XxxController {
  constructor(private readonly xxxService: XxxService) {}
}

@Injectable()
class XxxService {
  constructor(
    private readonly xxxReader: XxxReader,
    private readonly xxxCreator: XxxCreator,
  ) {}
}

@Injectable()
class XxxReader {
  constructor(private readonly xxxRepository: XxxRepository) {}
  // Implement는 Repository 직접 사용 OK
}
```

| 호출자 | 호출 가능 대상 |
|---|---|
| Controller | Service만 |
| Service | Implement (Reader / Creator / Updater / Remover 등)만 |
| Implement | Repository (Database) + 다른 Implement (예외 허용) |
| Repository | TypeORM 내부에서만 사용 |

## 8. 다중 write 시 `@Transactional()` 필수

Service 메서드가 **두 개 이상의 write 연산(INSERT / UPDATE / DELETE / soft delete)** 을 수행하면 `typeorm-transactional`의 **`@Transactional()` 데코레이터를 반드시 적용**합니다. 중간에 실패해도 모든 write가 함께 롤백돼 데이터 정합성이 깨지지 않게 합니다.

판단 기준은 **Service가 호출하는 Implement(Reader/Creator/Updater/Remover) 내부에서 일어나는 write 연산을 모두 합산**합니다. 예를 들어 `Updater.replace*()` 가 내부적으로 DELETE + INSERT를 모두 수행하면 그것만으로 이미 다중 write이므로 호출하는 Service 메서드에 `@Transactional()`이 필요합니다.

```ts
import { Transactional } from 'typeorm-transactional';

@Injectable()
class XxxService {
  // ✅ Good — 다중 write → @Transactional 필수
  @Transactional()
  async replacePermissions(adminAccountId: number, permissionIds: number[]): Promise<void> {
    // Updater 내부에서 DELETE + INSERT 두 번의 write
    await this.adminAccountPermissionUpdater.replacePermissions(adminAccountId, permissionIds);
  }

  @Transactional()
  async deleteAdminAccount(id: number): Promise<void> {
    // Remover 내부에서 DELETE × 2 + SOFT DELETE × 1
    await this.adminAccountRemover.softDeleteById(id);
  }

  @Transactional()
  async createPreset(data: CreatePresetData): Promise<number> {
    // Creator 내부에서 INSERT(preset) + BULK INSERT(preset items)
    return this.presetCreator.create(data);
  }

  // ❌ Bad — 다중 write인데 @Transactional 누락
  async replacePermissions(adminAccountId: number, permissionIds: number[]): Promise<void> {
    // DELETE 후 INSERT 사이에 실패하면 권한이 모두 사라진 상태로 남을 수 있음
    await this.adminAccountPermissionUpdater.replacePermissions(adminAccountId, permissionIds);
  }
}
```

> read-only 메서드(`getXxx`, `findXxx`)는 `@Transactional()` 불필요. 단일 write도 엄밀히는 불필요하지만 일관성을 위해 모든 write 메서드에 붙이는 것도 허용.

> `@Transactional()`은 **Service 레이어에만** 사용합니다. Implement(Reader/Creator/Updater/Remover) 레이어에 붙이지 않습니다 — Implement는 자체 트랜잭션을 관리하지 않고 Service의 트랜잭션 컨텍스트 안에서 실행되어야 합니다.
