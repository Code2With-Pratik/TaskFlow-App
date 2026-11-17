
import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from 'cors';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter.js';

export function configureApp(
  app: INestApplication,
  config: ConfigService,
): void {
  app.use(cookieParser());
  app.use(
    express.json({
      limit: '2mb',
      verify: (request, _response, buffer) => {
        Object.assign(request, { rawBody: Buffer.from(buffer) });
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Frontend URLs allowed to access the backend
  const frontendUrls = config
    .getOrThrow<string>('FRONTEND_URL')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => new URL(url).origin);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. server-to-server)
      if (!origin || frontendUrls.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.enableCors(corsOptions);

  // Request validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception handling
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription(
      'HTTP API for the TaskFlow project and task management app.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, swaggerDocument);
}
