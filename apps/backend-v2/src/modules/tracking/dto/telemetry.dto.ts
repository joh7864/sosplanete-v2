import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';
import { EventType, SessionStatus } from '@prisma/client';

export class StartSessionDto {
  @IsNumber()
  @IsNotEmpty()
  childId: number;

  @IsString()
  @IsNotEmpty()
  childPseudo: string;

  @IsNumber()
  @IsNotEmpty()
  instanceId: number;

  @IsString()
  @IsNotEmpty()
  schoolYear: string;

  @IsNumber()
  @IsOptional()
  instanceYearId?: number;

  @IsString()
  @IsOptional()
  deviceType?: string; // 'MOBILE_PORTRAIT' | 'MOBILE_LANDSCAPE' | 'DESKTOP'

  @IsString()
  @IsOptional()
  browser?: string;

  @IsString()
  @IsOptional()
  os?: string;
}

export class TelemetryEventItemDto {
  @IsEnum(EventType)
  @IsNotEmpty()
  eventType: EventType;

  @IsString()
  @IsNotEmpty()
  target: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  timeSpentSeconds?: number;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  timestamp?: string;
}

export class LogEventsBatchDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsArray()
  @IsNotEmpty()
  events: TelemetryEventItemDto[];
}

export class CloseSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class PurgeSessionsDto {
  @IsNumber()
  @IsNotEmpty()
  instanceId: number;

  @IsString()
  @IsOptional()
  schoolYear?: string;

  @IsNumber()
  @IsOptional()
  olderThanDays?: number;
}
