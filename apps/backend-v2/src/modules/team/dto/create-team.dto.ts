import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Les Aventuriers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#D1FAE5', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'user', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  instanceId?: number;

  @ApiProperty({ example: '2024-2025', required: false })
  @IsString()
  @IsOptional()
  schoolYear?: string;

  @ApiProperty({ example: 42, required: false })
  @IsOptional()
  instanceYearId?: number;

  @ApiProperty({ example: 'https://chat.whatsapp.com/...', required: false })
  @IsString()
  @IsOptional()
  whatsappInviteUrl?: string;

  @ApiProperty({ example: '120363024888888888@g.us', required: false })
  @IsString()
  @IsOptional()
  whatsappGroupId?: string;
}
