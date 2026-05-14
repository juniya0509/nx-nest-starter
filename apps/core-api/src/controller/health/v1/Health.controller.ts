import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { SwaggerApiOperation } from '../../../support/api-docs/SwaggerApiOperation';
import { SwaggerApiTags } from '../../../support/api-docs/SwaggerApiTags';

@SwaggerApiTags('Health')
@Controller()
export class HealthController {
  constructor() {}

  @SwaggerApiOperation({
    summary: 'Health Check',
    description: '**이 API는 공통 Response를 적용받지 않습니다.**\n서버와 주요 의존성이 정상 작동 중인지 확인합니다.',
  })
  @ApiOkResponse({
    type: Boolean,
    description: '서버가 정상일 경우 true 반환',
    example: true,
  })
  @Get('/v1/health')
  checkHealth(): true {
    return true;
  }

  @SwaggerApiOperation({
    summary: 'Ping',
    description: '**이 API는 공통 Response를 적용받지 않습니다.**\n서버 응답 속도를 확인하기 위한 ping 요청입니다.',
  })
  @ApiOkResponse({
    type: String,
    description: '서버가 정상일 경우 "pong" 반환',
    example: 'pong',
  })
  @Get('/v1/health/ping')
  ping(): string {
    return 'pong';
  }
}
