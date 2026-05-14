# syntax=docker/dockerfile:1.7
#
# 단일 Dockerfile — admin-api / core-api / batch 공용.
# 호출 측이 APP_NAME build-arg 로 빌드할 앱을 지정한다.
#
# 예: docker build --build-arg APP_NAME=admin-api .
#
# 산출 image 는 환경 무관 (12-factor). dev/prod 차이는 런타임에 env_file 로 주입.

ARG NODE_VERSION=22.14.0
ARG PNPM_VERSION=10.33.1

############################################################
# Stage 1 — builder
############################################################
FROM node:${NODE_VERSION}-alpine AS builder

ARG PNPM_VERSION
ARG APP_NAME

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# starter 단순화: 전체 워크스페이스 복사 후 install + build
# (lock 파일만 먼저 복사하는 캐시 최적화는 후속 작업)
COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm nx build "${APP_NAME}" -c production

############################################################
# Stage 2 — runtime
############################################################
# @nx/js:swc 는 application 용 package.json 을 자동 생성하지 않고,
# 또 swc 의 paths resolution 이 source 위치 상대경로로 require 를 박는 특성상
# 빌드 산출물(dist/apps/<app>) 의 main.js 가 lib 빌드 산출물(dist/libs/<lib>) 을
# 같은 부모(dist/) 아래에서 찾아야 한다. 그래서 outputPath 는 workspace_root/dist/* 그대로 유지.
#
# 단 이 위치에서 main.js 가 node_modules 를 resolve 하지 못하는 문제는
# NODE_PATH 로 apps/<app>/node_modules (pnpm strict isolation 의 admin/core/batch 의 deps symlink 디렉터리)
# 를 추가 검색 경로로 지정해서 해결.
# 향후 개선 방향은 .claude/docs/CD.md 의 "Module resolution" 섹션 참고.
FROM node:${NODE_VERSION}-alpine AS runtime

ARG PNPM_VERSION
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# 워크스페이스 전체 복사 (builder 에서 nx build 까지 끝낸 상태)
COPY --from=builder /workspace/ ./

# dev deps 제거하고 prod deps 만 남기기 — lockfile 기반이라 빠름.
# CI=true: pnpm 이 dev deps 제거를 위한 인터랙티브 confirmation 건너뜀
ENV CI=true
RUN pnpm install --frozen-lockfile --prod

# main.js 의 require 가 strict isolation 의 deps symlink 디렉터리를 찾도록.
# app 본인 deps + 의존하는 모든 lib 의 deps (lib 자체의 transitive 패키지 — sql-formatter 등) 까지 명시.
# 새 lib 추가 시 이 목록도 갱신 필요.
ENV NODE_PATH=/app/apps/${APP_NAME}/node_modules:/app/libs/core-contract/node_modules:/app/libs/core-database/node_modules:/app/libs/core-domain/node_modules:/app/libs/core-enum/node_modules:/app/libs/core-util/node_modules

# admin-api / core-api → 3000, batch → 3001 (docker-compose 의 ports 가 결정)
EXPOSE 3000 3001

# nx swc 산출물 경로: dist/apps/<app>/src/main.js (workspace_root 의 dist)
CMD node dist/apps/${APP_NAME}/src/main.js
