import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActionRefModule } from './modules/action-ref/action-ref.module';
import { InstanceModule } from './modules/instance/instance.module';
import { TeamModule } from './modules/team/team.module';
import { GroupModule } from './modules/group/group.module';
import { ChildModule } from './modules/child/child.module';
import { LocalActionModule } from './modules/local-action/local-action.module';
import { PeriodModule } from './modules/period/period.module';
import { UsersModule } from './modules/users/users.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { LegacyApiModule } from './modules/legacy-api/legacy-api.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CategoryModule } from './modules/category/category.module';
import { CategoryRefModule } from './modules/category-ref/category-ref.module';
import { ImpactModule } from './modules/impact/impact.module';
import { StimulationModule } from './modules/stimulation/stimulation.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    CategoryModule,
    CategoryRefModule,
    ImpactModule,
    NotificationModule,
    ScheduleModule.forRoot(),
    // SEC-07 — Rate limiting global : 100 requêtes/minute par IP par défaut
    // Les routes d'auth ont une limite plus stricte via @Throttle() dans auth.controller.ts
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 500, // Augmenté à 500 pour éviter les 429 sur le jeu v1
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ActionRefModule,
    InstanceModule,
    TeamModule,
    GroupModule,
    ChildModule,
    LocalActionModule,
    PeriodModule,
    TrackingModule,
    ServeStaticModule.forRoot(
      {
        // Route /static/ → pointe directement vers le dossier uploads (pour le jeu v1)
        rootPath: process.env.UPLOADS_DIR || join(__dirname, '..', '..', '..', 'uploads'),
        serveRoot: '/static',
      },
      {
        rootPath: process.env.UPLOADS_DIR ? join(process.env.UPLOADS_DIR, '..') : join(__dirname, '..', '..', '..'),
        serveRoot: '/',
      }
    ),
    LegacyApiModule,
    StimulationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // SEC-07 — Active le ThrottlerGuard globalement sur toutes les routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
