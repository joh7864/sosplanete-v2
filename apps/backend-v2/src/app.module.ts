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

@Module({
  imports: [
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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
