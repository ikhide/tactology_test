import { HttpStatus, HttpException } from '@nestjs/common';

interface ResponsePayload<T> {
  success: boolean;
  message: string;
  code: number;
  data?: T | null;
}

export class ApiResponse {
  static success<T>(
    data: T,
    message: string = 'Operation successful',
    code: number = HttpStatus.OK,
  ): ResponsePayload<T> {
    return {
      success: true,
      message,
      code,
      data,
    };
  }

  static created<T>(
    data: T,
    message: string = 'Resource created successfully',
    code: number = HttpStatus.CREATED,
  ): ResponsePayload<T> {
    return {
      success: true,
      message,
      code,
      data,
    };
  }

  static successNoData(
    message: string = 'Operation successful',
    code: number = HttpStatus.OK,
  ): ResponsePayload<boolean> {
    return {
      success: true,
      message,
      code,
      data: true,
    };
  }

  static error(
    message: string = 'An error occurred',
    code: number = HttpStatus.INTERNAL_SERVER_ERROR,
  ): ResponsePayload<null> {
    return {
      success: false,
      message,
      code,
      data: null,
    };
  }

  static notFound(
    message: string = 'Resource not found',
  ): ResponsePayload<null> {
    return ApiResponse.error(message, HttpStatus.NOT_FOUND);
  }

  static badRequest(message: string = 'Bad request'): ResponsePayload<null> {
    return ApiResponse.error(message, HttpStatus.BAD_REQUEST);
  }

  static fromError(error: unknown): ResponsePayload<null> {
    let message = 'An unexpected error occurred';
    let code = HttpStatus.INTERNAL_SERVER_ERROR;

    if (error instanceof HttpException) {
      message = error.message;
      code = error.getStatus();
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error('API Response Error:', error);
    return ApiResponse.error(message, code);
  }
}
