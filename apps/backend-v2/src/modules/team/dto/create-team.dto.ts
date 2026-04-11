import { IsString, IsNotEmpty, IsOptional, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Les Aventuriers' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#FFE4E1', required: false })
  @IsString()
  @IsOptional()
  @IsHexColor({ message: "La couleur doit être un code hexadécimal valide" })
  color?: string;

  @ApiProperty({ example: 'user', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  instanceId: number;
}
