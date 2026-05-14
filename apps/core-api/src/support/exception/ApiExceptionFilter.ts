import { randomUUID } from 'crypto';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { instanceToPlain } from 'class-transformer';
import dayjs from 'dayjs';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

import { CoreDomainError } from '@libs/core-domain/src/support/error/CoreDomainError';

import { ApiError } from '../error/ApiError';
import { ApiExceptionLogger, LogType } from '../logger/ApiExceptionLogger';
import { ApiExceptionSentryCapture } from '../monitoring/ApiExceptionSentryCapture';
import { ApiErrorNotifier } from '../notifier/ApiExceptionNotifier';
import { ApiResponse } from '../response/ApiResponse';

type ErrorSource = 'Core';

type AppError = {
  code: string;
  summary: string;
  source: ErrorSource;
};

type NormalizedException = {
  statusCode: number;
  errorCode: string;
  errorSummary: string;
  errorSource: ErrorSource;
  errorData: unknown;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const normalized = this.normalizeException(exception);
    const traceId = this.resolveTraceId(req);
    const translatedMessage = this.translateMessage(req, normalized.errorCode, normalized.errorSummary);
    const log = this.createLog(req, exception, normalized, traceId, translatedMessage);

    ApiExceptionLogger.logError(log);
    ApiErrorNotifier.notify(log);
    ApiExceptionSentryCapture.capture(log);

    const responseBody = instanceToPlain(ApiResponse.error(traceId, normalized.errorCode, translatedMessage, normalized.errorData));
    res.status(normalized.statusCode).json(responseBody);
  }

  private normalizeException(exception: unknown): NormalizedException {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (isAppError(response)) {
        return {
          statusCode,
          errorCode: response.code,
          errorSummary: response.summary,
          errorSource: response.source,
          errorData: null,
        };
      }

      if (isObject(response) && isAppError(response.errorType)) {
        return {
          statusCode,
          errorCode: response.errorType.code,
          errorSummary: response.errorType.summary,
          errorSource: response.errorType.source,
          errorData: response.errorData ?? null,
        };
      }

      const fallback = this.mapHttpExceptionToApiError(exception);
      return {
        statusCode,
        errorCode: fallback.code,
        errorSummary: fallback.summary,
        errorSource: fallback.source,
        errorData: isObject(response) ? (response.message ?? null) : null,
      };
    }

    return {
      statusCode: 500,
      errorCode: ApiError.DEFAULT_ERROR.code,
      errorSummary: ApiError.DEFAULT_ERROR.summary,
      errorSource: ApiError.DEFAULT_ERROR.source,
      errorData: null,
    };
  }

  private mapHttpExceptionToApiError(exception: HttpException): ApiError {
    if (exception instanceof BadRequestException) return ApiError.DEFAULT_BAD_REQUEST_ERROR;
    if (exception instanceof NotFoundException) return ApiError.DEFAULT_NOT_FOUND;
    if (exception instanceof PayloadTooLargeException) return ApiError.PAYLOAD_TOO_LARGE;
    return ApiError.DEFAULT_ERROR;
  }

  private translateMessage(req: Request, errorCode: string, errorSummary: string): string {
    const langHeader = req.headers['x-user-lang'];
    const clientLanguage = (Array.isArray(langHeader) ? langHeader[0] : langHeader) ?? 'en-US';
    // core-api 는 ApiError / CoreDomainError 모두 CoreError.json 에서 번역 조회
    const fullKey = `CoreError.${errorCode}`;
    // nestjs-i18n 의 translate 는 generic 추론이 어려워 unknown 으로 잡힘 — locale JSON 이 string value 만 가진다고 보장하므로 캐스팅
    const translated = this.i18n.translate(fullKey, { lang: clientLanguage }) as string;
    // 키 누락 시 nestjs-i18n 이 키 자체를 반환 → enum 의 한국어 summary 로 fallback
    return translated === fullKey ? errorSummary : translated;
  }

  private resolveTraceId(req: Request): string {
    const headerValue = req.headers['x-request-id'];
    const inbound = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    return inbound && inbound.length > 0 ? inbound : randomUUID();
  }

  private createLog(
    req: Request,
    exception: unknown,
    normalized: NormalizedException,
    traceId: string,
    translatedMessage: string,
  ): LogType {
    return {
      timestamp: dayjs().toDate(),
      traceId,
      service: process.env.API_APP_NAME ?? 'core-api',
      env: process.env.NODE_ENV ?? 'development',
      status: normalized.statusCode,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
      },
      error: {
        code: normalized.errorCode,
        name: exception instanceof Error ? exception.name : 'UnknownError',
        summary: normalized.errorSummary,
        message: translatedMessage,
        errorData: normalized.errorData,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    };
  }
}

function isAppError(value: unknown): value is AppError {
  if (value instanceof CoreDomainError || value instanceof ApiError) {
    return true;
  }

  if (!isObject(value)) return false;
  return typeof value.code === 'string' && typeof value.summary === 'string' && value.source === 'Core';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
