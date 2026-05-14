import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOperationOptions } from '@nestjs/swagger';

export function SwaggerApiOperation(options: ApiOperationOptions): MethodDecorator {
  return applyDecorators(ApiOperation(options));
}
