import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitScoreDto {
  @ApiProperty({ description: 'Score obtenu dans le jeu', example: 4850 })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiProperty({ description: 'Vague / Niveau atteint', example: 3, default: 1 })
  @IsNumber()
  @Min(1)
  waveReached: number;
}
