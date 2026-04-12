import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Sécurisation de Swagger en production
  app.use(
    ['/api', '/api-json'],
    basicAuth({
      challenge: true,
      users: {
        nnauru: "nnauruc'estch0ue!!e",
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('SOS Planète API v2')
    .setDescription("Documentation interactive de l'API de refonte sos-planete")
    .setVersion('2.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
