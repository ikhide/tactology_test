import { Module } from '@nestjs/common';
import { GraphQLErrorFormatter } from './formatters/graphql-error.formatter';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  providers: [GraphQLErrorFormatter, HttpExceptionFilter],
  exports: [GraphQLErrorFormatter, HttpExceptionFilter],
})
export class CommonModule {}
