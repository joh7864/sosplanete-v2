import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  @IsOptional()
  role?: Role;
}
