import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Filtre d'exception global.
 * - Intercepte toutes les erreurs non gérées
 * - Traduit les erreurs Prisma (P2002, P2025...) en réponses HTTP lisibles
 * - Évite de fuiter des stacktraces en production
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Conflit de contrainte unique : la valeur existe déjà (champ : ${(exception.meta?.target as string[])?.join(', ')})`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Ressource introuvable';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Contrainte de clé étrangère violée';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message = 'La relation entre les entités est invalide';
          break;
        default:
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          message = `Erreur base de données (${exception.code})`;
      }
      this.logger.warn(`Prisma ${exception.code} sur ${request.method} ${request.url}: ${exception.message}`);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Données invalides envoyées à la base de données';
      this.logger.warn(`Prisma validation error sur ${request.method} ${request.url}`);
    } else {
      // Erreur inconnue — on log le stacktrace côté serveur uniquement
      this.logger.error(
        `Erreur non gérée sur ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
