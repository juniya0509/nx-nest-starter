#!/usr/bin/env bash
# 전체 앱 통합 실행 스크립트 — admin-api + core-api + batch 를 동시에 실행한다.
#
# 동작 흐름:
# - libs 변경: nx watch가 감지 → tsc 재빌드
# - apps 변경: SWC --watch가 감지 → app dist 재emit
# - 위 둘 중 하나가 dist를 갱신하면 nodemon이 감지 → 해당 앱 재시작

set -euo pipefail

NODE_ENV="${NODE_ENV:-local}"

# Nx daemon이 dev 세션 사이의 source 변경을 stale 상태로 들고 있어 빌드가 옛 결과를
# 재사용하는 경우가 있어, daemon/캐시를 완전히 리셋하고 dist도 비워 fresh build로 시작.
echo "▶ Resetting Nx daemon + cache..."
nx reset

echo "▶ Cleaning dist..."
rm -rf dist

echo "▶ Initial build (fresh)..."
nx run-many --target=build --projects=admin-api,core-api,batch -c=local --output-style=static --skip-nx-cache

# SWC --watch는 시작 시 dist를 wipe→재emit하므로 nodemon이 곧바로 node를 띄우면
# 로딩 중간에 의존 파일이 사라져 MODULE_NOT_FOUND가 발생한다.
# 마커 파일을 만들어두고 dist/.../main.js가 그보다 최신이 될 때까지 대기 → 초기 race 방지.
MARKER=$(mktemp -t nx-dev-marker.XXXXXX)
trap 'rm -f "$MARKER"' EXIT

# Ctrl+C / SIGTERM은 정상 종료로 처리 (concurrently의 SIGTERM 전파로 인한 non-zero exit를 0으로)
trap 'exit 0' INT TERM

echo "▶ Starting watchers + nodemon..."

set +e
concurrently --kill-others \
  -n libs,admin-bld,core-bld,batch-bld,admin,core,batch \
  -c blue,cyan,cyan,cyan,green,magenta,yellow \
  'nx watch --projects=core-enum,core-domain,core-database,core-contract,core-util -- nx build \$NX_PROJECT_NAME --skip-nx-cache' \
  'nx build admin-api -c local --watch' \
  'nx build core-api -c local --watch' \
  'nx build batch -c local --watch' \
  "until [ dist/apps/admin-api/src/main.js -nt '$MARKER' ]; do sleep 0.3; done; sleep 0.5; nodemon --watch dist/libs --watch dist/apps/admin-api -e js --quiet --delay 100ms --exec 'cross-env NODE_ENV=${NODE_ENV} node --inspect=9230 dist/apps/admin-api/src/main.js'" \
  "until [ dist/apps/core-api/src/main.js -nt '$MARKER' ]; do sleep 0.3; done; sleep 0.5; nodemon --watch dist/libs --watch dist/apps/core-api -e js --quiet --delay 100ms --exec 'cross-env NODE_ENV=${NODE_ENV} node --inspect=9229 dist/apps/core-api/src/main.js'" \
  "until [ dist/apps/batch/src/main.js -nt '$MARKER' ]; do sleep 0.3; done; sleep 0.5; nodemon --watch dist/libs --watch dist/apps/batch -e js --quiet --delay 100ms --exec 'cross-env NODE_ENV=${NODE_ENV} node --inspect=9231 dist/apps/batch/src/main.js'"
exit 0
