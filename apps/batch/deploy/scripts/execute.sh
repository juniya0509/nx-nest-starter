#!/bin/bash
#
# CodeDeploy AfterInstall hook — EC2 에서 실행됨.
# CI workflow 가 만든 .codedeploy-env 의 변수 (IMAGE_URI / NODE_ENV / ECR_REGISTRY / AWS_REGION / HEALTH_PORT / APP_NAME) 를 사용.
# batch 는 단일 인스턴스 + in-place 배포라 ALB blue/green 이 아니지만 health check 는 동일하게 수행.

set -euo pipefail

DEPLOY_DIR="/home/ubuntu/deploy"
cd "$DEPLOY_DIR"

# shellcheck disable=SC1091
source ./.codedeploy-env

echo "👉 [${APP_NAME}] Deploy start"
echo "   image: ${IMAGE_URI}"
echo "   env:   ${NODE_ENV}"

echo "🔐 [${APP_NAME}] ECR login"
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

echo "🧹 [${APP_NAME}] Stop existing containers"
docker compose down || true

echo "⬇️  [${APP_NAME}] Pull new image"
docker compose pull

echo "🚀 [${APP_NAME}] Start"
docker compose up -d

echo "🗑  [${APP_NAME}] Cleanup unused images"
docker image prune -f || true

echo "🩺 [${APP_NAME}] Health check (port ${HEALTH_PORT})"
for i in $(seq 1 20); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${HEALTH_PORT}/v1/health" || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "✅ [${APP_NAME}] Health check succeeded"
    exit 0
  fi
  echo "⏳ [${APP_NAME}] retry ${i}/20 (status: ${STATUS})"
  sleep 5
done

echo "❌ [${APP_NAME}] Health check failed — recent logs:"
docker compose logs --tail 200 || true
exit 1
