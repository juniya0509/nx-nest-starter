import * as path from 'path';

import { ApiSchema } from '@nestjs/swagger';

export function AdminSwaggerApiPrefixedSchema(modulePath?: string): ClassDecorator {
  const prefix = modulePath ? path.basename(modulePath, path.extname(modulePath)) : 'Admin';

  return (target) => {
    ApiSchema({ name: `${target.name}_${prefix}` })(target);
  };
}
