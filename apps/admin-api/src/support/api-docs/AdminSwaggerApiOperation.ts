import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOperationOptions } from '@nestjs/swagger';

export function AdminSwaggerApiOperation(options: ApiOperationOptions): MethodDecorator {
  return applyDecorators(ApiOperation(options));
}
