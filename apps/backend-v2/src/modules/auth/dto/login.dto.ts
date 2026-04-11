import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@sos-planete.fr' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  password: string;

  @ApiProperty({ example: true, required: false })
  rememberMe?: boolean;
}
