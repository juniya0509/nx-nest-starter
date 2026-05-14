---
name: dto-convention
description: Application Layer Request/Response DTO 작성 규칙. `*Req.dto.ts`/`*Res.dto.ts` 파일 작성·수정 시. **Request DTO는 파일명을 모두 `*Req.dto.ts`로 통일**하지만 **클래스명은 의미에 따라 `*Req`(Body) / `*Query`(Query Param) / `*Param`(Path Param)으로 구분**. `class-validator`·`class-transformer`, `@Exclude`/`@Expose`, Domain으로 전달하는 `to*Data()` 변환 메서드, Response의 `static of(...)` 팩토리 적용 시 사용. **단건 조회 응답은 `Detail` 접미사 사용 금지** (`AdminGetXxxRes`). Swagger 응답 명세·Controller 데코레이터 자체는 `swagger-api` skill 참고.
---

# DTO 규칙 (Application Layer)

## Request DTO

- 클라이언트가 전달해야 하는 데이터를 정의합니다.
- **하나의 요청은 하나의 파일(`*.dto.ts`)** 에 정의합니다.

### 파일명 vs 클래스명

| 위치 | 규칙 |
|---|---|
| **파일명** | 항상 `*Req.dto.ts` 형태로 통일. (예: `CreateUserReq.dto.ts`, `GetUserListReq.dto.ts`, `GetUserReq.dto.ts`) |
| **클래스명** | 의미에 따라 접미사 구분 — `*Req`(Body) / `*Query`(Query Param) / `*Param`(Path Param) |

```ts
// ✅ Body — 파일: CreateUserReq.dto.ts / 클래스: CreateUserReq
export class CreateUserReq {
  @IsEmail() readonly email: string;
  // ...
}

// ✅ Query — 파일: GetUserListReq.dto.ts / 클래스: GetUserListQuery
export class GetUserListQuery {
  @Type(() => Number) @IsInt() @Min(1)
  readonly page: number = 1;
}

// ✅ Path Param — 파일: GetUserReq.dto.ts / 클래스: GetUserParam
export class GetUserParam {
  @Type(() => Number) @IsInt() @Min(1)
  readonly userId!: number;
}
```

> 컨트롤러에서 `@Body()` / `@Query()` / `@Param()` 데코레이터와 클래스 접미사가 의미적으로 일치하도록 매칭.

### Body Request DTO (`class *Req {}`)
- **생성자를 사용하지 않습니다.**
- `class-validator`, `class-transformer`로 유효성 검증.
- Domain Layer가 요구하는 형태로 가공하여 **Data 클래스로 변환하는 메서드**(`to*Data()`)를 반드시 제공합니다.
- Request DTO와 Data가 1:1이어도 **레이어 분리를 위해 반드시 Data로 변환**합니다.

```ts
// CreateUserReq.dto.ts
export class CreateUserReq {
  @ApiProperty({ type: 'string', format: 'email', minLength: 3, maxLength: 254 })
  @IsEmail()
  @Length(3, 254)
  readonly email: string;

  @ApiProperty({
    type: 'string',
    pattern: passwordRegex.source,
    minLength: 8,
    maxLength: 20,
    description: '숫자 + 영어 + 특수문자(@$!%*#?&) 조합, 8~20자',
  })
  @IsString()
  @Length(8, 20)
  @Matches(passwordRegex)
  readonly password: string;

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 30 })
  @IsString()
  @Length(1, 30)
  readonly firstname: string;

  @ApiProperty({ type: 'string', minLength: 1, maxLength: 30 })
  @IsString()
  @Length(1, 30)
  readonly lastname: string;

  toCreateUserData(): CreateUserData {
    return CreateUserData.fromReqDto({
      email: this.email,
      password: this.password,
      fullname: `${this.firstname} ${this.lastname}`,
    });
  }
}
```

### Query Request DTO (`class *Query {}`)

```ts
// GetUserListReq.dto.ts  ← 파일명은 Req
export class GetUserListQuery {
  @ApiProperty({ type: 'integer', minimum: 1, description: '페이지' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiProperty({ type: 'integer', minimum: 1, description: '페이지 당 불러올 개수' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit: number = 20;
}
```

### Path Param Request DTO (`class *Param {}`)

```ts
// GetUserReq.dto.ts  ← 파일명은 Req
export class GetUserParam {
  @ApiProperty({ type: 'integer', description: '조회할 회원 번호' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly userId!: number;
}
```

## Response DTO (`*Res.dto.ts`)

- `@Exclude()`로 private 필드를 감춥니다.
- 노출할 `get` 메서드에 `@Expose()` + `@ApiProperty()`를 붙입니다.
- **`static of(...)` 팩토리 메서드**로 생성합니다.
- Swagger의 `Type<unknown>` 제약 때문에 **생성자는 `public`** 으로 둡니다 (private 사용 시 컴파일 에러).

### 단건 조회 Response 네이밍

단건 조회 Response DTO에는 **`Detail` 접미사를 사용하지 않습니다.** `Get + EntityName + Res` 형식으로 충분합니다.

```ts
// ✅ Good
AdminGetAccountRes
AdminGetPresetRes

// ❌ Bad
AdminGetAccountDetailRes
AdminGetPresetDetailRes
```

### 예시

```ts
export class CreateUserRes {
  @Exclude() private readonly _createdUserId: number;
  @Exclude() private readonly _createdUserFullname: string;

  constructor(createdUser: GetUserResult) {
    this._createdUserId = createdUser.id;
    this._createdUserFullname = createdUser.fullname;
  }

  @ApiProperty({ type: 'integer', description: '회원가입한 유저 ID' })
  @Expose()
  get createdUserId(): number {
    return this._createdUserId;
  }

  @ApiProperty({ type: 'string', description: '회원가입한 유저 이름' })
  @Expose()
  get createdUserFullname(): string {
    return this._createdUserFullname;
  }

  static of(createdUser: GetUserResult): CreateUserRes {
    return new CreateUserRes(createdUser);
  }
}
```

## Controller 사용 예

```ts
@Get('/v1/users/:userId')
async getUser(@Param() request: GetUserParam): Promise<ApiResponse<GetUserRes>> {
  const result = await this.userService.getUser(request.userId);
  return ApiResponse.successWithData(GetUserRes.of(result));
}

@Get('/v1/users')
async getUserList(@Query() request: GetUserListQuery): Promise<ApiResponse<GetUserListRes>> {
  const { totalPages, totalResults, list } = await this.userService.getUserList(request.page, request.limit);
  return ApiResponse.successWithData(GetUserListRes.of(totalPages, totalResults, list));
}

@Post('/v1/users')
async createUser(@Body() request: CreateUserReq): Promise<ApiResponse<CreateUserRes>> {
  const result = await this.userService.createUser(request.toCreateUserData());
  return ApiResponse.successWithData(CreateUserRes.of(result));
}
```
