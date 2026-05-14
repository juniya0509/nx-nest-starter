# 아키텍처

## 레이어

```
┌─────────────────────────────────────────────┐
│              Application Layer              │  ← Controller, Request/Response DTO
├─────────────────────────────────────────────┤
│     Domain Layer (Business Logic & Rules)   │  ← Business Logic (*.service.ts)
├─────────────────────────────────────────────┤
│             Implementation Layer            │  ← Implement Logic (*.reader.ts, *.creator.ts ...)
├─────────────────────────────────────────────┤
│                Database Layer               │  ← Entity, Repository
└─────────────────────────────────────────────┘
```

| 계층 | 역할 |
| - | - |
| **Application Layer** | 외부 영역 및 요청, 응답에 대한 처리 |
| **Domain Layer** | 비즈니스 로직 |
| **Implementation Layer** | 비즈니스 로직을 동작하게 만드는 상세 구현 로직 |
| **Database Layer** | 데이터 접근하여 자원 제공 |

## 애플리케이션 간 참조 규칙

애플리케이션은 다른 애플리케이션의 내부 코드를 참조할 수 없습니다.
단, `libs/` 하위의 공통 라이브러리는 모든 애플리케이션에서 자유롭게 참조할 수 있습니다.

starter 의 공통 라이브러리 (5개):

| 라이브러리 | 역할 |
| - | - |
| `libs/core-enum` | 도메인 enum / 상수 |
| `libs/core-contract` | 외부 서비스 계약 (push / sms / mail 등) |
| `libs/core-database` | TypeORM 엔티티 + Repository + DB 설정 (Database Layer 공용) |
| `libs/core-domain` | Service / Reader / Creator / Updater / Remover (Domain + Implementation Layer 공용) |
| `libs/core-util` | 도메인 무관 유틸 함수 |

### 허용되지 않는 예시
1. `core-api`에서 `admin-api/src/domain` 하위의 도메인 참조 (**애플리케이션 내부 참조 금지**)

### 허용되는 예시
1. `admin-api`, `core-api` 모두 `libs/core-domain`, `libs/core-enum`, `libs/core-database` 등 공통 라이브러리를 참조할 수 있습니다.
2. `admin-api`라고 해서 반드시 `admin-api` 내부 도메인만 사용해야 하는 것은 아닙니다.
도메인 로직이 애플리케이션 간 동일하게 동작하는 경우 `core-domain`을 사용해도 됩니다.
   - 예시: 공지사항 게시글 목록 조회는 `admin-api`와 `core-api`에서 도메인 레벨 로직이 동일하므로 `core-domain`을 공유해서 사용합니다.
   - 반대로 admin 전용 로직이 필요한 도메인만 `admin-api/src/domain`에 두고, 공통으로 재사용 가능한 로직은 `core-domain`에 배치합니다.

## 의존성 규칙

레이어는 위에서 아래로 순방향으로만 참조합니다.

### 허용되지 않는 규칙 예시
1. User.service.ts에서 Application Layer에 있는 CreateUserReq.dto.ts 참조 (**역방향 참조** Domain Layer <-> Application Layer)
2. User.service.ts에서 같은 Domain Layer에 있는 Auth.service.ts 참조 (**동일 레이어 참조** Domain Layer <-> Domain Layer)
3. User.service.ts에서 Database Layer에 있는 User.repository.ts 참조 (**계층을 건너뛴 참조** Domain Layer <-> Database Layer)

### 예외 사항
1. Implement Layer는 예외적으로 서로 같은 레이어에서 참조를 허용합니다.  
구현체 로직의 재사용성을 높이기 위함입니다.
2. **`batch` 앱은 Database Layer (Repository) 를 직접 호출할 수 있습니다.** 대량 정리/집계 같은 일괄 작업은 도메인 layer 의 Implement (Reader/Creator/Updater/Remover) 를 거치지 않고 raw query 또는 Repository 메서드를 직접 호출하는 편이 효율적이므로 예외로 둡니다.

## 도메인 클래스 위치 컨벤션

Domain / Implementation Layer 의 입출력 타입은 inline 으로 두지 않고 별도 클래스로 분리합니다.

- Service / Reader / Creator 등이 받는 입력: `data/<Name>Data.ts`
- Service / Reader 등이 반환하는 출력: `result/<Name>Result.ts`
- 둘 다 RORO + `private constructor` + `static of(...)` 팩토리 패턴

상세 규칙은 `data-result-convention` skill 참고.

## 빌드 산출물 / 배포 단위

각 앱은 독립 Docker image 로 빌드되어 다음 구조로 배포됩니다:

| 앱 | 배포 단위 |
| - | - |
| `admin-api` | ALB + Auto Scaling Group (Blue/Green single-TG) |
| `core-api` | ALB + Auto Scaling Group (Blue/Green single-TG) |
| `batch` | 단일 EC2 (cron only, ALB 없음, In-place 배포) |

빌드는 nx affected 기반으로 **변경된 앱만 재배포** 됩니다. lib 변경 시 nx dep graph 가 의존 앱 모두 affected 처리.

상세 흐름은 `.claude/docs/CD.md`, 인프라 셋업 단계는 `.claude/docs/INFRA_SETUP.md` 참고.

## Batch 앱

cron 기반 정기 작업 (만료 토큰 정리, 통계 집계, 외부 데이터 sync 등) 을 담당하는 별도 애플리케이션입니다.

- 위치: `apps/batch/`
- 실행 모델: **상시 실행 + `@nestjs/schedule`**. `@Cron` 데코레이터로 schedule 등록, ALB / ECS health check 를 위해 가벼운 HTTP 서버 (`/v1/health`, `/v1/health/ping`) 도 함께 띄움.
- cron handler 는 `apps/batch/src/batch/<domain>/<JobName>.batch.ts` 위치에 두고, 클래스명은 `<JobName>Batch` 로 끝냅니다.
- 모든 cron 은 `BatchExceptionHandler.execute('<jobName>', async () => {...})` 으로 감싸 logger / Sentry / Slack notifier 가 자동 호출되도록 합니다.
- admin / core 영역의 데이터 모두 처리할 수 있는 통합 batch 앱입니다 (별도 admin-batch / core-batch 분리 X).