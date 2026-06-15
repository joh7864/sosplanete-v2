import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as basicAuth from 'express-basic-auth';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  // SEC-01 — Bloquer le démarrage si JWT_SECRET n'est pas défini
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[SÉCURITÉ] JWT_SECRET est absent. Arrêt du serveur en production.');
    } else {
      console.warn('⚠️  [DEV] JWT_SECRET non défini — un secret temporaire est utilisé. NE JAMAIS faire cela en production.');
    }
  }

  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // SEC-03 — Validation globale des DTOs (active les décorateurs class-validator)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,         // Désactivé : l'API utilise des objets littéraux dans de nombreux contrôleurs
    forbidNonWhitelisted: false,
    transform: true,          // Convertit automatiquement les types (string → number, string → Date…)
  }));

  // SEC-04 — Filtre d'exception global (traduit erreurs Prisma, masque stacktraces)
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: [
      'https://sosplanete.nnauru.net',
      'https://admin.sosplanete.nnauru.net',
      'http://localhost:3000',
      'http://localhost:3010',
      'http://localhost:5173',
      'http://localhost:5174',
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Autorise les connexions réseau local (Mobile)
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,  // Alternative réseau local
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/ // Alternative réseau local
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With, X-Instance-Id',
  });

  // Sécurisation de Swagger en production
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPass = process.env.SWAGGER_PASSWORD;

  if (!swaggerPass) {
    if (process.env.NODE_ENV === 'production') {
      // SEC-05 — En production sans SWAGGER_PASSWORD, on bloque l'accès complètement
      console.warn('⚠️ WARNING: SWAGGER_PASSWORD non défini. Swagger désactivé en production.');
      return; // Ne pas exposer Swagger
    } else {
      console.warn('⚠️  [DEV] SWAGGER_PASSWORD non défini — Swagger sans authentification en développement.');
    }
  }

  app.use(
    ['/api', '/api-json'],
    basicAuth({
      // SEC-05 — Plus de fallback hardcodé. En dev sans password, on désactive le challenge
      challenge: !!swaggerPass,
      users: swaggerPass ? { [swaggerUser]: swaggerPass } : {},
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
