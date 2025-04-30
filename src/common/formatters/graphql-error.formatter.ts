import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface ErrorWithStacktrace {
  stacktrace?: string[];
}

interface ErrorWithResponse {
  response?: string | { message?: string };
  status?: string | number;
}

function hasStacktrace(obj: unknown): obj is ErrorWithStacktrace {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'stacktrace' in obj &&
    Array.isArray((obj as ErrorWithStacktrace).stacktrace)
  );
}

function hasResponse(obj: unknown): obj is ErrorWithResponse {
  return typeof obj === 'object' && obj !== null && 'response' in obj;
}

function getErrorCode(code: unknown): string {
  if (typeof code === 'string') {
    return code;
  }
  if (typeof code === 'number') {
    return code.toString();
  }
  return 'INTERNAL_SERVER_ERROR';
}

@Injectable()
export class GraphQLErrorFormatter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  formatError(error: GraphQLError): GraphQLFormattedError {
    // Extract the stack trace safely
    const stackTrace = this.extractStackTrace(error);

    // Log the error with stack trace if available
    this.logger.error(`GraphQL Error: ${error.message}`, {
      stack: stackTrace || 'No stack trace available',
      context: GraphQLErrorFormatter.name,
    });

    // Original error from NestJS or anywhere in the app
    const originalError = error.extensions?.exception;

    // Format based on error type
    if (originalError && hasResponse(originalError)) {
      const responseMessage = this.extractResponseMessage(
        originalError,
        error.message,
      );
      const errorCode =
        originalError.status?.toString() || 'INTERNAL_SERVER_ERROR';

      return {
        message: responseMessage,
        extensions: {
          code: errorCode,
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && stackTrace
            ? { stacktrace: this.formatStackTrace(error) }
            : {}),
        },
      };
    }

    // Default formatting
    return {
      message: error.message,
      extensions: {
        code: getErrorCode(error.extensions?.code),
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && stackTrace
          ? { stacktrace: this.formatStackTrace(error) }
          : {}),
      },
    };
  }

  private extractStackTrace(error: GraphQLError): string | null {
    const exception = error.extensions?.exception;

    if (hasStacktrace(exception)) {
      return exception.stacktrace.join('\n');
    }

    if (error.stack) {
      return error.stack;
    }

    return null;
  }

  private formatStackTrace(error: GraphQLError): string[] | undefined {
    const exception = error.extensions?.exception;

    if (hasStacktrace(exception)) {
      return exception.stacktrace;
    }

    if (error.stack) {
      return error.stack.split('\n');
    }

    return undefined;
  }

  private extractResponseMessage(
    originalError: ErrorWithResponse,
    defaultMessage: string,
  ): string {
    if (typeof originalError.response === 'string') {
      return originalError.response;
    }

    if (
      originalError.response &&
      typeof originalError.response === 'object' &&
      'message' in originalError.response
    ) {
      return originalError.response.message || defaultMessage;
    }

    return defaultMessage;
  }
}
