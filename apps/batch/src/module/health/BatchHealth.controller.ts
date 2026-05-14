import { Controller, Get } from '@nestjs/common';

/**
 * batch 앱은 외부 API 가 아니므로 swagger 데코레이터 / 공통 응답을 적용하지 않는다.
 * ALB / ECS / k8s health check 용 단순 endpoint 만 노출.
 */
@Controller()
export class BatchHealthController {
  @Get('/v1/health')
  checkHealth(): true {
    return true;
  }

  @Get('/v1/health/ping')
  ping(): string {
    return 'pong';
  }
}
