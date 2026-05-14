import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse as SwaggerApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiErrorMessage } from '../response/ApiErrorMessage';
import { ApiResponse } from '../response/ApiResponse';

type SwaggerSuccessModel = Type<unknown> | null;

export function SwaggerApiResponseSuccess(status = 200, models: SwaggerSuccessModel | SwaggerSuccessModel[], description = '성공') {
  const modelList = Array.isArray(models) ? models : [models];
  const realModels = modelList.filter((m): m is Type<unknown> => m !== null);

  const refs = realModels.map((model) => getSchemaPath(model));

  let dataSchema: Record<string, unknown>;

  if (modelList.length === 1 && modelList[0] === null) {
    dataSchema = { type: 'null' };
  } else if (refs.length === 1 && !modelList.includes(null)) {
    dataSchema = { $ref: refs[0] };
  } else {
    dataSchema = {
      oneOf: [...refs.map((ref) => ({ $ref: ref })), ...(modelList.includes(null) ? [{ type: 'null' }] : [])],
    };
  }

  return applyDecorators(
    ApiExtraModels(ApiResponse, ApiErrorMessage, ...realModels),
    SwaggerApiResponse({
      status,
      description,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              result: {
                type: 'string',
                enum: ['SUCCESS'],
              },
              data: dataSchema,
              error: {
                nullable: true,
              },
            },
            required: ['result', 'data', 'error'],
          },
        },
      },
    }),
  );
}
