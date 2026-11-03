import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EasterEggDifficulty, EasterEggTriggerType } from '@prisma/client';

/** Convertit une valeur en chaîne (les saisies cryptex peuvent arriver sous forme numérique). */
const toStringValue = ({ value }: { value: unknown }) =>
  value === null || value === undefined ? value : String(value);

// ---------------------------------------------------------------------------
// DTO Joueur
// ---------------------------------------------------------------------------

export class SubmitAnswerDto {
  @Type(() => Number)
  @IsInt()
  easterEggId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  periodId?: number;

  @Transform(toStringValue)
  @IsString()
  @MaxLength(200)
  answer: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  resolutionTimeSeconds?: number;
}

export class ValidateTriggerDto {
  @Type(() => Number)
  @IsInt()
  easterEggId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  periodId?: number;

  @IsEnum(EasterEggTriggerType)
  triggerType: EasterEggTriggerType;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  resolutionTimeSeconds?: number;

  @IsOptional()
  metadata?: any;
}

export class ShareEasterEggDto {
  @Type(() => Number)
  @IsInt()
  easterEggId: number;

  @IsIn(['TEAM', 'PLAYER', 'ALL'])
  targetType: 'TEAM' | 'PLAYER' | 'ALL';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  targetPlayerId?: number;

  @IsIn(['CLUE', 'SOLUTION'])
  shareType: 'CLUE' | 'SOLUTION';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customText?: string;
}

export class InteractEggDto {
  @Type(() => Number)
  @IsInt()
  easterEggId: number;
}

export class ReopenPeriodDto {
  @Type(() => Number)
  @IsInt()
  periodId: number;
}

export class MetaEnigmaCodeDto {
  @Transform(toStringValue)
  @IsString()
  @MaxLength(100)
  code: string;
}

// ---------------------------------------------------------------------------
// DTO Administration
// ---------------------------------------------------------------------------

export class CreateEasterEggDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  prerequisiteType?: string;

  @IsOptional()
  prerequisiteConfig?: any;

  @IsString()
  crypticMessage: string;

  @IsOptional()
  @IsString()
  explicitHint?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hintDelayMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mascotDurationSeconds?: number;

  @IsOptional()
  @IsString()
  triggerAction?: string | null;

  @IsOptional()
  @IsString()
  senderLore?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clues?: string[];

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(EasterEggTriggerType)
  triggerType?: EasterEggTriggerType;

  @IsOptional()
  @IsString()
  expectedAnswer?: string | null;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @IsOptional()
  triggerConfig?: any;

  @IsOptional()
  @IsEnum(EasterEggDifficulty)
  complexity?: EasterEggDifficulty;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rewardPointsIT?: number;

  @IsOptional()
  @IsString()
  specialReward?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEasterEggDto extends PartialType(CreateEasterEggDto) {}

export class UpdateEasterEggSettingsDto {
  @IsOptional()
  @IsBoolean()
  easterEggsEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  easterEggFrequency?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  easterEggRequiredPlayers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  easterEggMaxWinningTeams?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  easterEggPauseCycles?: number[];

  @IsOptional()
  @IsString()
  metaEnigmaSecretWord?: string;

  @IsOptional()
  metaEnigmaPeriodGlyphs?: any;
}

export class ResetEggProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  instanceYearId?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  easterEggIds?: number[];

  @IsOptional()
  @IsBoolean()
  all?: boolean;
}

export class ImportCatalogDto {
  @IsArray()
  @IsObject({ each: true })
  items: any[];

  @IsOptional()
  @IsIn(['upsert', 'replace'])
  mode?: 'upsert' | 'replace';
}

export class ReorderCatalogDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  orderedIds: number[];
}

export class OpenInstanceEggDto {
  @Type(() => Number)
  @IsInt()
  instanceYearId: number;

  @Type(() => Number)
  @IsInt()
  easterEggId: number;

  @IsOptional()
  @IsBoolean()
  closePrevious?: boolean;
}

export class CloseInstanceEggDto {
  @Type(() => Number)
  @IsInt()
  instanceYearId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  easterEggId?: number;
}

export class ForceHintDto {
  @Type(() => Number)
  @IsInt()
  instanceYearId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  easterEggId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;

  @IsOptional()
  @IsBoolean()
  revoke?: boolean;
}
