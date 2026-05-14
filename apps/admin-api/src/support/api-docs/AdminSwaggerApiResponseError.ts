import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse as SwaggerApiResponse, getSchemaPath } from '@nestjs/swagger';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { AdminApiError } from '../error/AdminApiError';
import { AdminApiErrorMessage } from '../response/AdminApiErrorMessage';

type SwaggerErrorExampleInput =
  | (AdminApiError | CoreDomainError)
  | {
      error: AdminApiError | CoreDomainError;
      data?: unknown;
    };

type ExampleEntry = {
  summary?: string;
  value?: unknown;
};

export function AdminSwaggerApiResponseError(status: number, examples: SwaggerErrorExampleInput[]) {
  const exampleMap = examples.reduce<Record<string, ExampleEntry>>((acc, example, index) => {
    const errorObj = isWrappedExample(example) ? example.error : example;
    const dataObj = isWrappedExample(example) ? example.data : undefined;

    acc[`example${index + 1}`] = {
      summary: errorObj.summary,
      value: {
        result: 'ERROR',
        data: null,
        error: {
          code: errorObj.code,
          message: errorObj.summary,
          ...(dataObj ? { data: dataObj } : { data: null }),
        },
      },
    };
    return acc;
  }, {});

  return applyDecorators(
    ApiExtraModels(AdminApiError),
    SwaggerApiResponse({
      status,
      description: Object.values(exampleMap)
        .map((e) => e.summary)
        .join(' / '),
      content: {
        'application/json': {
          examples: exampleMap,
          schema: {
            type: 'object',
            properties: {
              result: {
                type: 'string',
                enum: ['ERROR'],
              },
              data: {
                type: 'null',
                nullable: true,
              },
              error: {
                $ref: getSchemaPath(AdminApiErrorMessage),
              },
            },
            required: ['result', 'data', 'error'],
          },
        },
      },
    }),
  );
}

function isWrappedExample(value: SwaggerErrorExampleInput): value is { error: AdminApiError | CoreDomainError; data?: unknown } {
  return typeof value === 'object' && value !== null && 'error' in value;
}
