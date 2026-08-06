import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const DEFAULT_DB_URL =
  'postgresql://nnauru:me4nnauru@localhost:5433/nnauru?schema=public';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const dbUrl =
      process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ''
        ? process.env.DATABASE_URL
        : DEFAULT_DB_URL;

    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
      process.env.DATABASE_URL = dbUrl;
    }

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
