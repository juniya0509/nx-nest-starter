import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

export function SwaggerApiTags(...tags: string[]): ClassDecorator & MethodDecorator {
  return applyDecorators(ApiTags(...tags));
}
