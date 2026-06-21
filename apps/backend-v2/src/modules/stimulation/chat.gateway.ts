import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  // Stockage temporaire pour le rate-limiting : clientId -> timestamps de messages (ms)
  private clientMessageTimestamps = new Map<string, number[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Hook de connexion WebSockets avec Authentification forte
   */
  async handleConnection(client: Socket) {
    try {
      const authHeader =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization ||
        (client.handshake.query?.token as string);

      if (!authHeader) {
        this.logger.warn(`[Chat WebSockets] Tentative de connexion sans token de ${client.id}`);
        client.disconnect();
        return;
      }

      let child = null;
      let user = null;

      // Extract instanceId from query
      const instanceIdStr = client.handshake.query?.instanceId as string;

      // 1. Essayer de décoder comme Basic Auth (ou chaîne base64 brute)
      let isBasic = false;
      let base64Token = authHeader;
      if (authHeader.startsWith('Basic ')) {
        base64Token = authHeader.substring(6).trim();
        isBasic = true;
      }

      // Si le token n'est pas un JWT et ressemble à du base64 pseudo:pass
      const isJwt = authHeader.includes('.') && !isBasic;

      if (!isJwt) {
        try {
          const decoded = Buffer.from(base64Token, 'base64').toString('utf8');
          if (decoded.includes(':')) {
            const [username, password] = decoded.split(':');
            
            // Convert instanceId to number if present
            const parsedInstanceId = instanceIdStr ? parseInt(instanceIdStr, 10) : undefined;
            
            // Valider en tant que joueur (child)
            child = await this.authService.validateChild(username, password, parsedInstanceId);
            
            if (!child) {
              // Valider en tant qu'admin (user)
              user = await this.authService.validateUser(username, password);
            }
          }
        } catch (e) {
          this.logger.warn(`[Chat WebSockets] Échec du décodage Base64 pour ${client.id}: ${e.message}`);
        }
      }

      // 2. Si pas de Basic Auth valide, essayer avec JWT
      if (!child && !user && isJwt) {
        try {
          const tokenValue = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader;
          const payload = this.jwtService.verify(tokenValue);
          if (payload) {
            if (payload.childId || payload.sub) {
              const id = payload.childId || payload.sub;
              // On cherche d'abord dans child
              child = await this.prisma.child.findUnique({
                where: { id },
                include: { group: { include: { team: true } } },
              });
              if (!child) {
                user = await this.prisma.user.findUnique({
                  where: { id },
                });
              }
            }
          }
        } catch (err) {
          this.logger.warn(`[Chat WebSockets] Échec de la vérification JWT pour ${client.id}: ${err.message}`);
        }
      }

      // 3. Assigner les données au client et rejoindre les salons
      if (child) {
        // Enfant/Joueur connecté
        const fullChild = await this.prisma.child.findUnique({
          where: { id: child.id },
          include: { group: { include: { team: true } } },
        });
        if (fullChild && fullChild.group && fullChild.group.team) {
          client.data.childId = fullChild.id;
          client.data.pseudo = fullChild.pseudo;
          client.data.teamId = fullChild.group.teamId;
          client.data.teamName = fullChild.group.team.name;
          client.data.instanceYearId = fullChild.group.team.instanceYearId;
          client.data.role = 'CHILD';

          // Rejoindre automatiquement son canal équipe
          const teamRoom = `team_${fullChild.group.teamId}`;
          await client.join(teamRoom);
          this.logger.log(`[Chat WebSockets] Joueur @${fullChild.pseudo} connecté (Équipe: ${fullChild.group.team.name})`);
        } else {
          this.logger.warn(`[Chat WebSockets] Joueur sans groupe/équipe pour l'id ${child.id}`);
          client.disconnect();
          return;
        }
      } else if (user) {
        // Admin connecté
        client.data.userId = user.id;
        client.data.pseudo = user.name || 'Admin';
        client.data.role = 'ADMIN';

        this.logger.log(`[Chat WebSockets] Admin ${client.data.pseudo} connecté`);
      } else {
        this.logger.warn(`[Chat WebSockets] Authentification échouée pour ${client.id}`);
        client.disconnect();
        return;
      }

      // Rejoindre automatiquement le canal global
      await client.join('global');

    } catch (err) {
      this.logger.error(`[Chat WebSockets] Erreur de poignée de main : ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.clientMessageTimestamps.delete(client.id);
    this.logger.log(`[Chat WebSockets] Client déconnecté : ${client.id}`);
  }

  /**
   * Envoi d'un message sur le canal GLOBAL
   */
  @SubscribeMessage('sendGlobal')
  async handleGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { text: string },
  ) {
    if (!client.data.pseudo) return;

    // 1. Contrôle Anti-Spam (Rate Limiting)
    if (this.isRateLimited(client.id)) {
      client.emit('chatError', 'Anti-spam active. Veuillez patienter avant d\'envoyer un nouveau message.');
      return;
    }

    // Interception des commandes (messages privés / chuchotements)
    if (body.text && body.text.startsWith('/')) {
      const isCommand = await this.handleChatCommand(client, body.text);
      if (isCommand) return;
    }

    // 2. Assainissement du texte (Sanitization XSS)
    const sanitizedText = this.sanitize(body.text);
    if (!sanitizedText || sanitizedText.trim() === '') return;

    const messageData = {
      id: Math.random().toString(36).substring(2, 9),
      sender: client.data.pseudo,
      role: client.data.role,
      teamName: client.data.teamName || null,
      content: sanitizedText,
      timestamp: new Date(),
    };

    // Propager à tous ceux présents dans la room global
    this.server.to('global').emit('msgGlobal', messageData);
  }

  /**
   * Envoi d'un message sur le canal d'ÉQUIPE (Scoping strict)
   */
  @SubscribeMessage('sendTeam')
  async handleTeamMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { text: string },
  ) {
    // Les admins ne peuvent pas envoyer de messages sur le canal équipe car ils n'ont pas d'équipe
    if (client.data.role !== 'CHILD' || !client.data.teamId) {
      client.emit('chatError', 'Seuls les joueurs membres d\'une équipe peuvent communiquer dans ce canal.');
      return;
    }

    // 1. Contrôle Anti-Spam (Rate Limiting)
    if (this.isRateLimited(client.id)) {
      client.emit('chatError', 'Anti-spam active. Veuillez patienter avant d\'envoyer un nouveau message.');
      return;
    }

    // Interception des commandes (messages privés / chuchotements)
    if (body.text && body.text.startsWith('/')) {
      const isCommand = await this.handleChatCommand(client, body.text);
      if (isCommand) return;
    }

    // 2. Assainissement du texte (Sanitization XSS)
    const sanitizedText = this.sanitize(body.text);
    if (!sanitizedText || sanitizedText.trim() === '') return;

    const messageData = {
      id: Math.random().toString(36).substring(2, 9),
      sender: client.data.pseudo,
      role: client.data.role,
      teamName: client.data.teamName,
      content: sanitizedText,
      timestamp: new Date(),
    };

    const teamRoom = `team_${client.data.teamId}`;
    // Propager uniquement à l'équipe
    this.server.to(teamRoom).emit('msgTeam', messageData);
  }

  /**
   * Analyse et traite les commandes de chat (chuchotements ou messages d'équipe privés)
   * Retourne true si le message était une commande (gérée), false sinon.
   */
  private async handleChatCommand(
    client: Socket,
    text: string,
  ): Promise<boolean> {
    if (!text.startsWith('/')) {
      return false;
    }

    // Extraction de la cible et du message. Format: /cible message
    const match = text.match(/^\/(\S+)\s*(.*)$/);
    if (!match) {
      client.emit('chatError', 'Format incorrect. Utilisez : /<nom_joueur_ou_equipe> <message>');
      return true;
    }

    const targetName = match[1];
    const content = match[2]?.trim();

    if (!content) {
      client.emit('chatError', 'Veuillez saisir un message après le nom du destinataire.');
      return true;
    }

    const sanitizedContent = this.sanitize(content);
    if (!sanitizedContent) {
      return true;
    }

    // 1. Chercher si la cible correspond à une équipe (case-insensitive) dans la même instance
    const targetTeam = await this.prisma.team.findFirst({
      where: {
        name: {
          equals: targetName,
          mode: 'insensitive',
        },
        ...(client.data.instanceYearId ? { instanceYearId: client.data.instanceYearId } : {}),
      },
    });

    if (targetTeam) {
      // C'est un message privé d'équipe !
      // Seuls les joueurs (CHILD) peuvent envoyer/recevoir des messages d'équipe
      if (client.data.role !== 'CHILD') {
        client.emit('chatError', 'Seuls les joueurs peuvent envoyer des messages d\'équipe.');
        return true;
      }

      const messageData = {
        id: Math.random().toString(36).substring(2, 9),
        sender: client.data.pseudo,
        role: client.data.role,
        teamName: client.data.teamName,
        targetTeamName: targetTeam.name,
        content: sanitizedContent,
        isPrivate: true,
        timestamp: new Date(),
      };

      // Diffuser à la room de l'équipe cible
      const teamRoom = `team_${targetTeam.id}`;
      this.server.to(teamRoom).emit('msgPrivateTeam', messageData);

      // Si le client n'est pas dans l'équipe cible, lui renvoyer aussi le message pour affichage
      if (client.data.teamId !== targetTeam.id) {
        client.emit('msgPrivateTeam', messageData);
      }

      this.logger.log(
        `[Chat WebSockets] Message privé d'équipe de @${client.data.pseudo} vers l'équipe ${targetTeam.name}`,
      );
      return true;
    }

    // 2. Chercher si la cible correspond à un joueur en ligne dans la même instance
    // On va chercher dans tous les sockets connectés au namespace chat pour trouver le destinataire
    const sockets = await this.server.fetchSockets();
    const targetSocket = sockets.find(
      s => s.data.pseudo && 
           s.data.pseudo.toLowerCase() === targetName.toLowerCase() &&
           (!client.data.instanceYearId || s.data.instanceYearId === client.data.instanceYearId),
    );

    if (targetSocket) {
      // C'est un whisper (message privé) à un joueur en ligne !
      const messageData = {
        id: Math.random().toString(36).substring(2, 9),
        sender: client.data.pseudo,
        role: client.data.role,
        teamName: client.data.teamName || null,
        targetPseudo: targetSocket.data.pseudo,
        content: sanitizedContent,
        isPrivate: true,
        timestamp: new Date(),
      };

      // Émettre au destinataire et à l'expéditeur
      targetSocket.emit('msgPrivate', messageData);
      
      // Si l'expéditeur n'est pas le destinataire lui-même, lui envoyer aussi
      if (targetSocket.id !== client.id) {
        client.emit('msgPrivate', messageData);
      }

      this.logger.log(
        `[Chat WebSockets] Whisper de @${client.data.pseudo} vers @${targetSocket.data.pseudo}`,
      );
      return true;
    }

    // Si le joueur n'est pas en ligne, on vérifie s'il existe en base de données dans la même instance pour donner une erreur plus précise
    const dbChild = await this.prisma.child.findFirst({
      where: {
        pseudo: {
          equals: targetName,
          mode: 'insensitive',
        },
        group: {
          team: {
            ...(client.data.instanceYearId ? { instanceYearId: client.data.instanceYearId } : {}),
          },
        },
      },
    });

    if (dbChild) {
      client.emit(
        'chatError',
        `Le joueur @${dbChild.pseudo} est hors ligne. Impossible de lui envoyer un message privé.`,
      );
      return true;
    }

    // Ni équipe, ni joueur trouvé
    client.emit(
      'chatError',
      `Destinataire ou équipe "${targetName}" introuvable.`,
    );
    return true;
  }

  /**
   * Gestion de l'ajout/suppression d'une réaction émoji en temps réel
   */
  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string; emoji: string },
  ) {
    if (!client.data.pseudo || !body.messageId || !body.emoji) return;

    // Diffuser la réaction à tous les clients connectés pour mise à jour synchrone locale
    this.server.emit('reactionAdded', {
      messageId: body.messageId,
      emoji: this.sanitize(body.emoji),
      username: client.data.pseudo,
    });
  }

  /**
   * Permet aux autres services backend de propager des alertes systèmes sur le chat global
   */
  sendSystemAlert(content: string) {
    const alertData = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'NEXUS SYSTEM',
      role: 'SYSTEM',
      content: this.sanitize(content),
      timestamp: new Date(),
    };
    this.server.to('global').emit('msgGlobal', alertData);
  }

  /**
   * Rate limiting : Maximum 3 messages toutes les 5 secondes par client
   */
  private isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.clientMessageTimestamps.get(clientId) || [];
    
    // Filtrer les timestamps de plus de 5 secondes
    const recentTimestamps = timestamps.filter(ts => now - ts < 5000);
    
    if (recentTimestamps.length >= 3) {
      return true;
    }
    
    recentTimestamps.push(now);
    this.clientMessageTimestamps.set(clientId, recentTimestamps);
    return false;
  }

  /**
   * Simple assainissement de chaîne pour supprimer les tags HTML / scripts
   */
  private sanitize(text: string): string {
    if (!text) return '';
    // Coupe à 500 caractères maximum
    const truncated = text.substring(0, 500);
    return truncated
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}
