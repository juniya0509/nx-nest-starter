import * as path from 'path';

import { ApiSchema } from '@nestjs/swagger';

export function SwaggerApiPrefixedSchema(modulePath?: string): ClassDecorator {
  const prefix = modulePath ? path.basename(modulePath, path.extname(modulePath)) : 'Api';

  return (target) => {
    ApiSchema({ name: `${target.name}_${prefix}` })(target);
  };
}
