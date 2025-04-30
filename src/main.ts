import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Apply validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Apply global error handling filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
// Fix: properly handle the promise by using .catch
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
