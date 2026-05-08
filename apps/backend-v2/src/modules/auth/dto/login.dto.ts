import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@sos-planete.fr' })
  @IsEmail({}, { message: 'Veuillez entrer un email valide' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  password: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
