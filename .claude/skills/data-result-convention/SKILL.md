---
name: data-result-convention
description: Domain/Implementation Layer의 Data, Result 클래스 작성 규칙. `*Data.ts`/`*Result.ts` 파일 작성 시. RORO 패턴 + `private readonly` Props 타입, `get` 메서드로 선택적 노출, `static from*`/`of` 팩토리, `*.service.ts`·`*.reader.ts` 내부에 타입 선언 금지(→ `data/`·`result/` 폴더에 클래스로 분리) 적용 시 사용. **타입 선언 위치 규칙의 primary skill.**
---

# Data / Result 규칙 (Domain / Implementation Layer)

> ⚠️ `*.service.ts`, `*.reader.ts` (Implement Layer), `*.repository.ts` 파일 안에는 타입을 선언하지 않습니다.
> `*.service.ts`, `*.reader.ts` → **`data/`, `result/` 폴더에 클래스로 선언**.
> `*.repository.ts` → **inline** 타입으로 작성.

## Data (`*Data.ts`)

Application Layer가 전달해준 값을 Domain/Implement Layer가 사용하기 적합한 형태로 정의합니다.

### 규칙
- **RORO 패턴**: Props 타입을 미리 선언하고, 생성자 파라미터명은 `data`.
- 접근/수정 방지를 위해 **`private readonly`** 선언.
- 외부 접근이 필요한 항목만 **`get` 메서드**로 노출.
- **`new` 대신 `static from*()` 팩토리 메서드** 사용 (Application Layer에서의 직접 인스턴스화 방지).

```ts
// firstname, lastname을 받아 fullname으로 가공해 전달하는 예
type CreateUserDataProps = {
  readonly email: string;
  readonly password: string;
  readonly fullname: string;
};

export class CreateUserData {
  private constructor(private readonly data: CreateUserDataProps) {}

  get email() {
    return this.data.email;
  }

  get password() {
    return this.data.password;
  }

  get fullname() {
    return this.data.fullname;
  }

  static fromReqDto(data: CreateUserDataProps): CreateUserData {
    return new CreateUserData({ ...data });
  }
}
```

## Result (`*Result.ts`)

Domain/Implement Layer에서 로직을 처리한 결과를 정의합니다.

### 규칙
- **RORO 패턴**: Props 타입 선언, 생성자 파라미터명은 `result`.
- `private readonly` 선언.
- 외부 접근이 필요한 항목만 `get` 메서드로 노출.
- 필요 시 원본 필드를 **가공한 파생 필드**를 `get`으로 제공 (예: `fullname`).
- **`static of(...)` 팩토리 메서드** 사용.

```ts
type GetUserResultProps = {
  readonly id: number;
  readonly email: string;
  readonly createdAt: Date;
  readonly firstname: string;
  readonly lastname: string;
};

export class GetUserResult {
  private constructor(private readonly result: GetUserResultProps) {}

  get id(): number {
    return this.result.id;
  }

  get email(): string {
    return this.result.email;
  }

  get createdAt(): Date {
    return this.result.createdAt;
  }

  get firstname(): string {
    return this.result.firstname;
  }

  get lastname(): string {
    return this.result.lastname;
  }

  // 파생 필드
  get fullname(): string {
    return `${this.result.firstname} ${this.result.lastname}`;
  }

  static of(result: GetUserResultProps): GetUserResult {
    return new GetUserResult(result);
  }
}
```
