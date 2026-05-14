import { applyDecorators } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';

export function SwaggerApiConsumes(...mediaTypes: string[]): MethodDecorator {
  return applyDecorators(ApiConsumes(...mediaTypes));
}
