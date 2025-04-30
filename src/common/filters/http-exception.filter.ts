import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'Unknown error';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    // Check if we're in a GraphQL context
    if (host.getType() === 'http') {
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error';

      const error = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: message,
      };

      this.logger.error(`${request.method} ${request.url} ${status}`, {
        stack: exception instanceof Error ? exception.stack : 'Unknown error',
        context: HttpExceptionFilter.name,
      });

      response.status(status).json(error);
    } else {
      // Handle GraphQL errors - we don't need the gqlHost variable, just log the error
      const errorMessage = getErrorMessage(exception);

      // Log the error
      this.logger.error(`GraphQL Error: ${errorMessage}`, {
        stack: exception instanceof Error ? exception.stack : 'Unknown error',
        context: HttpExceptionFilter.name,
      });

      // GraphQL exceptions are handled by Apollo Server, but we can log them here
      // Apollo automatically formats GraphQL errors for the client
      return exception;
    }
  }
}
