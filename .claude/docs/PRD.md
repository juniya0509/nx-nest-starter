# PRD: Nx/NestJS Monorepo Backend

## 목표
백엔드 팀에서 여러 프로젝트에 사용할 Nx/NestJS 기반 Monorepo 보일러플레이트를 개발한다.

## 애플리케이션
- **공통 애플리케이션 (Core API)**: 여러 Client가 접근 가능한 API Endpoint.
- **어드민(백오피스) 애플리케이션 (Admin API)**: Admin 권한이 있는 Client만 접근 가능한 API Endpoint.
- **배치 애플리케이션 (Batch)**: cron 기반 정기 작업 전용 (만료 토큰 정리, 통계 집계, 외부 데이터 sync 등). admin / core 영역의 데이터 모두 처리하는 통합 batch.

## 핵심 기능
- **회원/인증**: OAuth 2.0 및 Email Verify Code 기반의 인증, 어드민 역할(Role) 기반 접근 제어, 토큰 관리.
- **다국어/다국가**: Client 언어 및 시간등에 따른 다국어(i18n) 처리와 날짜포맷(timezone) 처리.
- **운영 지원**: 다국어(i18n) 리소스, 푸시/SMS 발송, 에러 로깅, 모니터링, 배치(스케줄 작업)로 데이터 동기화.

## 기술 원칙
- **API 규약**: REST + Swagger(OpenAPI) 기반, Request/Response DTO로 명세 고정. 어드민은 `Admin` 프리픽스로 분리.
- **아키텍처 방향**: Layered Architecture (Application → Domain → Implementation → Database) 단방향 참조 고정. 공통 로직은 `libs/core-*`로 공유.
- **응답/에러 포맷**: `ApiResponse` 통일 포맷 + 도메인/앱 별 에러 코드 상수(`ApiError`, `CoreDomainError`, `AdminApiError`, `BatchError`)로 일관된 에러 핸들링.
- **CI/CD 자동화**: GitHub Actions + AWS (ECR / S3 / CodeDeploy / EC2 ASG / ALB) 기반. nx affected 로 변경된 앱만 재배포. develop → development 환경, master → production 환경. (상세: `.claude/docs/CD.md`, 셋업 가이드: `.claude/docs/INFRA_SETUP.md`)