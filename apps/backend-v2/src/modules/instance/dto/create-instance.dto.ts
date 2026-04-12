import { IsString, IsNotEmpty, IsOptional, IsUrl, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstanceDto {
  @ApiProperty({ example: 'École du Petit Prince' })
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @ApiProperty({ example: 'petit-prince.sos-planete.fr', required: false })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: "L'URL de l'instance doit être une URL valide" })
  hostUrl?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  adminId?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isOpen?: boolean;

  @ApiProperty({ example: '2025-09-01T00:00:00Z', required: false })
  @IsOptional()
  gameStartDate?: Date;

  @ApiProperty({ example: 24, required: false })
  @IsInt()
  @IsOptional()
  gamePeriodsCount?: number;
}
