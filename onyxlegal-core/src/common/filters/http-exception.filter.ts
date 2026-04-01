import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Exception Filter implementing RFC 7807 standard for REST APIs.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal Server Error' };

    // Strict RFC 7807 formatting
    // Ref: https://datatracker.ietf.org/doc/html/rfc7807
    const errorBody = {
      type: `https://api.onyxlegal.com/errors/${status}`,
      title: exceptionResponse.error || 'Request Error',
      status: status,
      detail: exceptionResponse.message || exceptionResponse.detail || 'An unexpected error occurred.',
      instance: request.url,
      timestamp: new Date().toISOString(),
      // Attach further validation errors if sent by class-validator
      ...(Array.isArray(exceptionResponse.message) && {
        validation_errors: exceptionResponse.message,
      }),
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${
          (exception as any).message || exception
        }\n${(exception as any)?.stack}`,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} - ${errorBody.detail}`,
      );
    }

    response.status(status).json(errorBody);
  }
}
