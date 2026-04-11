import { Controller, Post, Body, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur et récupération du cookie JWT' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    
    const { access_token } = await this.authService.login(user);
    
    const maxAge = body.rememberMe 
      ? 1000 * 60 * 60 * 24 * 30 // 30 jours
      : 1000 * 60 * 60 * 24;      // 24 heures
    
    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    return {
      message: 'Connexion réussie',
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        managedInstances: user.managedInstances
      }
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Déconnexion réussie' };
  }
}
