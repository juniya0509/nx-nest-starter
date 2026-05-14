#!/usr/bin/env bash
# 단일 앱 로컬 개발 실행 스크립트
# - libs 변경: nx watch가 감지 → tsc 재빌드
# - 해당 app 변경: SWC --watch가 감지 → app dist 재emit
# - 위 둘 중 하나가 dist를 갱신하면 nodemon이 감지 → app 재시작
#
# usage: bash scripts/dev-app.sh <app-name> <inspect-port>

set -euo pipefail

APP="${1:?usage: dev-app.sh <app-name> <inspect-port>}"
INSPECT_PORT="${2:?usage: dev-app.sh <app-name> <inspect-port>}"

# 어디서 호출되든 워크스페이스 루트 기준으로 동작하도록 cwd 정규화
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

NODE_ENV="${NODE_ENV:-local}"

# Nx daemon이 dev 세션 사이의 source 변경을 stale 상태로 들고 있어 빌드가 옛 결과를
# 재사용하는 경우가 있어, daemon/캐시를 완전히 리셋하고 dist도 비워 fresh build로 시작.
echo "▶ Resetting Nx daemon + cache..."
nx reset

echo "▶ Cleaning dist..."
rm -rf dist

echo "▶ Initial build ($APP, fresh)..."
nx build "$APP" -c=local --output-style=static --skip-nx-cache

# SWC --watch는 시작 시 dist를 wipe→재emit하므로 nodemon이 곧바로 node를 띄우면
# 로딩 중간에 의존 파일이 사라져 MODULE_NOT_FOUND가 발생한다.
# 마커 파일을 만들어두고 dist/.../main.js가 그보다 최신이 될 때까지 대기 → 초기 race 방지.
MARKER=$(mktemp -t nx-dev-marker.XXXXXX)
trap 'rm -f "$MARKER"' EXIT

# Ctrl+C / SIGTERM은 정상 종료로 처리 (concurrently의 SIGTERM 전파로 인한 non-zero exit를 0으로)
trap 'exit 0' INT TERM

echo "▶ Starting watchers + nodemon ($APP)..."

set +e
concurrently --kill-others \
  -n libs,bld,app \
  -c blue,cyan,green \
  'nx watch --projects=core-enum,core-domain,core-database,core-contract,core-util -- nx build \$NX_PROJECT_NAME --skip-nx-cache' \
  "nx build $APP -c local --watch" \
  "until [ dist/apps/$APP/src/main.js -nt '$MARKER' ]; do sleep 0.3; done; sleep 0.5; nodemon --watch dist/libs --watch dist/apps/$APP -e js --quiet --delay 100ms --exec 'cross-env NODE_ENV=${NODE_ENV} node --inspect=${INSPECT_PORT} dist/apps/$APP/src/main.js'"
exit 0
