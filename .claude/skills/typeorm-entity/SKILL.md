---
name: typeorm-entity
description: TypeORM Entity/Repository/Column 규칙. `*.entity.ts`/`*.repository.ts` 파일 작성·수정 시. `BaseEntity` 상속, `@Column` 상세 정의(type·length·nullable·unique·comment), FK 비사용 논리 참조(`createForeignKeyConstraints` + `@JoinColumn`), `@CustomRepository` 적용, repository 메서드 타입은 **inline**으로 선언 시 사용. **엔티티 구조는 사용자가 직접 요청하지 않으면 수정하지 않음.**
---

# 데이터베이스 규칙 (TypeORM)

- **MySQL 8.0.44 / TypeORM 0.3** 기준.
- ⚠️ **엔티티는 명시적인 요청이 없으면 절대 임의로 수정하지 않습니다.**

## Entity 파일에 enum-like 타입 inline 선언 금지

상태값(`status`)이나 코드 구분 등 enum 성격을 가진 타입을 엔티티 파일에 inline `type` alias로 선언하지 않습니다. **반드시 별도 `*.enum.ts` 파일로 분리** (ts-jenum 패턴).

```ts
// ❌ Bad — entity 파일 안에 inline type alias
export type AdminAccountStatusUnion = 'ACTIVE' | 'SUSPENDED';

@Entity({ name: 'admin_account' })
export class AdminAccountEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 30 })
  status!: AdminAccountStatusUnion;
}

// ✅ Good — 별도 enum 파일에 ts-jenum 패턴으로 정의
// apps/admin-api/src/enum/AdminAccountStatus.enum.ts
@Enum('code')
export class AdminAccountStatus extends EnumType<AdminAccountStatus>() {
  static readonly ACTIVE = new AdminAccountStatus('ACTIVE', '활성화');
  static readonly SUSPENDED = new AdminAccountStatus('SUSPENDED', '정지');
  // ...
}
export type AdminAccountStatusUnion = EnumConstNames<typeof AdminAccountStatus>;

// AdminAccount.entity.ts — enum 파일에서 import
import { AdminAccountStatusUnion } from '../../../../enum/AdminAccountStatus.enum';
```

자세한 enum 작성 규칙은 `naming-convention` skill 참고.

## 베이스 엔티티 상속
모든 엔티티는 `@libs/core-database/src/mysql/entity/Base.entity`의 `BaseEntity`를 상속합니다.

```ts
import { BaseEntity } from '@libs/core-database/src/mysql/entity/Base.entity';

@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {}
```

## 엔티티 필드(컬럼)

- 엔티티 필드명: **camelCase**.
- 실제 컬럼명: `typeorm-naming-strategies/SnakeNamingStrategy`에 의해 **snake_case**로 변환되어 적용됩니다.
- `@Column` 사용 시 **type / length / nullable / unique / select / comment 등을 상세히** 기술합니다.

```ts
// Good
@Entity({ name: 'user' })
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 254, unique: true, comment: '이메일' })
  email: string;

  @Column({ type: 'varchar', length: 300, select: false, comment: '비밀번호' })
  password!: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '탈퇴 일자 (탈퇴 후 1년까지 정보 유지, 단 삭제표기는 함)',
  })
  withdrawnAt!: Date | null;

  @Column({ type: 'varchar', length: 80 })
  phoneNumber!: string; // DB 컬럼명: phone_number
}

// Bad — 컬럼 정보 누락
export class UserEntity extends BaseEntity {
  @Column() email: string;
  @Column() password!: string;
  @Column() withdrawnAt?: Date;
}
```

## Foreign Key 정책

**FK를 생성하지 않고 논리적 참조만** 합니다. (수작업 데이터 핸들링이 빈번하고, 테이블 구조 변경이 잦아 FK 관리 비용이 크기 때문.)

```ts
export class UserTokenEntity extends BaseEntity {
  @ManyToOne(() => CompanyEntity, {
    createForeignKeyConstraints: false, // FK 생성 안 함
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: CompanyEntity;
}
```

## Repository 패턴

- Entity에서 직접 쿼리 작성 **금지**.
- TypeORM 0.3에서 `@EntityRepository`가 중단되었으므로 프로젝트의 **`@CustomRepository`** 데코레이터를 사용합니다.
- Repository 파일 내부에서는 파라미터 타입을 **inline**으로 작성합니다 (별도 Data 클래스/타입 선언 금지).

```ts
@CustomRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
  async createUser(createUserData: {
    readonly email: string;
    readonly password: string;
    readonly firstname: string;
    readonly lastname: string;
    readonly countryCallingCode: CountryCallingCodeUnion;
    readonly phoneNumber: string;
    readonly countryCode: CountryCodeUnion;
  }): Promise<UserEntity> {
    const { email, password, firstname, lastname, countryCallingCode, phoneNumber, countryCode } = createUserData;

    const createdUser = await this.save(
      this.create({
        email,
        password,
        firstname,
        lastname,
        countryCallingCode,
        phoneNumber,
        countryCode,
      }),
    );

    return createdUser;
  }

  async findUserById(userId: number): Promise<UserEntity | null> {
    const user = await this.findOne({ where: { id: userId } });
    return user;
  }
}
```
