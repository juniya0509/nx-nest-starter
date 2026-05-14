import { applyDecorators } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';

export function AdminSwaggerApiConsumes(...mediaTypes: string[]): MethodDecorator {
  return applyDecorators(ApiConsumes(...mediaTypes));
}
