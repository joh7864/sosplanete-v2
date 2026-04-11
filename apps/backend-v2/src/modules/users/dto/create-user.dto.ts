import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit faire au moins 6 caractères' })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role, { message: 'Rôle invalide' })
  @IsOptional()
  role?: Role;
}
