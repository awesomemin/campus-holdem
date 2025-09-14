import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }));

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');
  if (!port) {
    throw new Error('PORT environment variable is required');
  }

  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap().catch(console.error);
