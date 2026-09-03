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

  // Historique des messages en mémoire (survit aux rechargements clients)
  private globalHistory: any[] = [];
  private teamHistories = new Map<number, any[]>();
  private privateHistories = new Map<string, any[]>();

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
        this.logger.warn(
          `[Chat WebSockets] Tentative de connexion sans token de ${client.id}`,
        );
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
            const parsedInstanceId = instanceIdStr
              ? parseInt(instanceIdStr, 10)
              : undefined;

            // Valider en tant que joueur (child)
            child = await this.authService.validateChild(
              username,
              password,
              parsedInstanceId,
            );

            if (!child) {
              // Valider en tant qu'admin (user)
              user = await this.authService.validateUser(username, password);
            }
          }
        } catch (e) {
          this.logger.warn(
            `[Chat WebSockets] Échec du décodage Base64 pour ${client.id}: ${e.message}`,
          );
        }
      }

      // 2. Si pas de Basic Auth valide, essayer avec JWT
      if (!child && !user && isJwt) {
        try {
          const tokenValue = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7).trim()
            : authHeader;
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
          this.logger.warn(
            `[Chat WebSockets] Échec de la vérification JWT pour ${client.id}: ${err.message}`,
          );
        }
      }

      // 3. Assigner les données au client et rejoindre les salons
      const isStealth =
        client.handshake.query?.isStealth === 'true' ||
        client.handshake.auth?.isStealth === true;
      client.data.isStealth = isStealth;

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
          this.logger.log(
            `[Chat WebSockets] Joueur @${fullChild.pseudo} connecté (Équipe: ${fullChild.group.team.name})`,
          );
        } else {
          this.logger.warn(
            `[Chat WebSockets] Joueur sans groupe/équipe pour l'id ${child.id}`,
          );
          client.disconnect();
          return;
        }
      } else if (user) {
        // Admin connecté
        client.data.userId = user.id;
        client.data.pseudo = user.name || 'Admin';
        client.data.role = 'ADMIN';

        this.logger.log(
          `[Chat WebSockets] Admin ${client.data.pseudo} connecté`,
        );
      } else {
        this.logger.warn(
          `[Chat WebSockets] Authentification échouée pour ${client.id}`,
        );
        client.disconnect();
        return;
      }

      // Rejoindre automatiquement le canal global
      await client.join('global');

      // Diffuser la liste des connectés
      this.broadcastOnlineUsers();

      // Envoyer l'historique de chat approprié au client connecté
      const myPseudo = (
        child ? child.pseudo : user ? user.name || 'Admin' : ''
      ).toLowerCase();
      const myTeamName = child?.group?.team?.name;
      const myTeamId = child?.group?.teamId;

      const myPrivateHistory: any[] = [];
      for (const [key, msgs] of this.privateHistories.entries()) {
        if (key.startsWith('team:')) {
          const targetTeam = key.substring(5).toLowerCase();
          if (myTeamName && targetTeam === myTeamName.toLowerCase()) {
            myPrivateHistory.push(...msgs);
          } else {
            // Inclure si l'utilisateur courant est l'expéditeur
            const sentToTeam = msgs.filter(
              (m) => m.sender.toLowerCase() === myPseudo,
            );
            myPrivateHistory.push(...sentToTeam);
          }
        } else {
          if (key.split(':').includes(myPseudo)) {
            myPrivateHistory.push(...msgs);
          }
        }
      }

      // Trier l'historique privé chronologiquement
      myPrivateHistory.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      client.emit('chatHistory', {
        global: this.globalHistory,
        team: myTeamId ? this.teamHistories.get(myTeamId) || [] : [],
        private: myPrivateHistory,
      });
    } catch (err) {
      this.logger.error(
        `[Chat WebSockets] Erreur de poignée de main : ${err.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.clientMessageTimestamps.delete(client.id);
    this.logger.log(`[Chat WebSockets] Client déconnecté : ${client.id}`);
    this.broadcastOnlineUsers();
  }

  /**
   * Envoi d'un message sur le canal GLOBAL
   */
  @SubscribeMessage('sendGlobal')
  async handleGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { text?: string; imageUrl?: string; parentId?: string },
  ) {
    if (!client.data.pseudo) return;

    // 1. Contrôle Anti-Spam (Rate Limiting)
    if (this.isRateLimited(client.id)) {
      client.emit(
        'chatError',
        "Anti-spam active. Veuillez patienter avant d'envoyer un nouveau message.",
      );
      return;
    }

    // Interception des commandes (messages privés / chuchotements)
    if (body.text && body.text.startsWith('/')) {
      const isCommand = await this.handleChatCommand(
        client,
        body.text,
        body.parentId,
        body.imageUrl,
      );
      if (isCommand) return;
    }

    // 2. Assainissement du texte (Sanitization XSS)
    const sanitizedText = this.sanitize(body.text || '');
    if ((!sanitizedText || sanitizedText.trim() === '') && !body.imageUrl)
      return;

    const messageData = {
      id: Math.random().toString(36).substring(2, 9),
      sender: client.data.pseudo,
      role: client.data.role,
      teamName: client.data.teamName || null,
      content: sanitizedText,
      imageUrl: body.imageUrl || null,
      timestamp: new Date(),
      parentId: body.parentId || null,
    };

    // Enregistrer dans l'historique global
    this.addToHistory(this.globalHistory, messageData);

    // Propager à tous ceux présents dans la room global
    this.server.to('global').emit('msgGlobal', messageData);
  }

  /**
   * Envoi d'un message sur le canal d'ÉQUIPE (Scoping strict)
   */
  @SubscribeMessage('sendTeam')
  async handleTeamMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { text?: string; imageUrl?: string; parentId?: string },
  ) {
    // Les admins ne peuvent pas envoyer de messages sur le canal équipe car ils n'ont pas d'équipe
    if (client.data.role !== 'CHILD' || !client.data.teamId) {
      client.emit(
        'chatError',
        "Seuls les joueurs membres d'une équipe peuvent communiquer dans ce canal.",
      );
      return;
    }

    // 1. Contrôle Anti-Spam (Rate Limiting)
    if (this.isRateLimited(client.id)) {
      client.emit(
        'chatError',
        "Anti-spam active. Veuillez patienter avant d'envoyer un nouveau message.",
      );
      return;
    }

    // Interception des commandes (messages privés / chuchotements)
    if (body.text && body.text.startsWith('/')) {
      const isCommand = await this.handleChatCommand(
        client,
        body.text,
        body.parentId,
        body.imageUrl,
      );
      if (isCommand) return;
    }

    // 2. Assainissement du texte (Sanitization XSS)
    const sanitizedText = this.sanitize(body.text || '');
    if ((!sanitizedText || sanitizedText.trim() === '') && !body.imageUrl)
      return;

    const messageData = {
      id: Math.random().toString(36).substring(2, 9),
      sender: client.data.pseudo,
      role: client.data.role,
      teamName: client.data.teamName,
      content: sanitizedText,
      imageUrl: body.imageUrl || null,
      timestamp: new Date(),
      parentId: body.parentId || null,
    };

    // Enregistrer dans l'historique d'équipe
    const teamId = client.data.teamId;
    if (teamId) {
      if (!this.teamHistories.has(teamId)) {
        this.teamHistories.set(teamId, []);
      }
      this.addToHistory(this.teamHistories.get(teamId)!, messageData);
    }

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
    parentId?: string,
    imageUrl?: string,
  ): Promise<boolean> {
    if (!text.startsWith('/')) {
      return false;
    }

    // Extraction de la cible et du message. Format: /cible message
    const match = text.match(/^\/(\S+)\s*(.*)$/);
    if (!match) {
      client.emit(
        'chatError',
        'Format incorrect. Utilisez : /<nom_joueur_ou_equipe> <message>',
      );
      return true;
    }

    const targetName = match[1];
    const content = match[2]?.trim();

    if (!content && !imageUrl) {
      client.emit(
        'chatError',
        'Veuillez saisir un message ou joindre une image.',
      );
      return true;
    }

    const sanitizedContent = this.sanitize(content || '');

    // 1. Chercher si la cible correspond à une équipe (case-insensitive) dans la même instance
    const targetTeam = await this.prisma.team.findFirst({
      where: {
        name: {
          equals: targetName,
          mode: 'insensitive',
        },
        ...(client.data.instanceYearId
          ? { instanceYearId: client.data.instanceYearId }
          : {}),
      },
    });

    if (targetTeam) {
      // C'est un message privé d'équipe !
      // Seuls les joueurs (CHILD) peuvent envoyer/recevoir des messages d'équipe
      if (client.data.role !== 'CHILD') {
        client.emit(
          'chatError',
          "Seuls les joueurs peuvent envoyer des messages d'équipe.",
        );
        return true;
      }

      const messageData = {
        id: Math.random().toString(36).substring(2, 9),
        sender: client.data.pseudo,
        role: client.data.role,
        teamName: client.data.teamName,
        targetTeamName: targetTeam.name,
        content: sanitizedContent,
        imageUrl: imageUrl || null,
        isPrivate: true,
        timestamp: new Date(),
        parentId: parentId || null,
      };

      // Enregistrer dans l'historique privé d'équipe
      const key = `team:${targetTeam.name.toLowerCase()}`;
      if (!this.privateHistories.has(key)) {
        this.privateHistories.set(key, []);
      }
      this.addToHistory(this.privateHistories.get(key)!, messageData);

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
      (s) =>
        s.data.pseudo &&
        s.data.pseudo.toLowerCase() === targetName.toLowerCase() &&
        (!client.data.instanceYearId ||
          s.data.instanceYearId === client.data.instanceYearId),
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
        imageUrl: imageUrl || null,
        isPrivate: true,
        timestamp: new Date(),
        parentId: parentId || null,
      };

      // Enregistrer dans l'historique privé
      const key = [
        client.data.pseudo.toLowerCase(),
        targetSocket.data.pseudo.toLowerCase(),
      ]
        .sort()
        .join(':');
      if (!this.privateHistories.has(key)) {
        this.privateHistories.set(key, []);
      }
      this.addToHistory(this.privateHistories.get(key)!, messageData);

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
            ...(client.data.instanceYearId
              ? { instanceYearId: client.data.instanceYearId }
              : {}),
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
    this.logger.log(
      `[Chat WebSockets] Réception de addReaction : pseudo=${client.data.pseudo}, messageId=${body?.messageId}, emoji=${body?.emoji}`,
    );
    if (!client.data.pseudo || !body.messageId || !body.emoji) {
      this.logger.warn(
        `[Chat WebSockets] addReaction rejetée : paramètres manquants.`,
      );
      return;
    }

    // Enregistrer la réaction dans l'historique en mémoire
    this.addReactionToHistory(
      body.messageId,
      this.sanitize(body.emoji),
      client.data.pseudo,
    );

    // Diffuser la réaction à tous les clients connectés pour mise à jour synchrone locale
    this.server.emit('reactionAdded', {
      messageId: body.messageId,
      emoji: this.sanitize(body.emoji),
      username: client.data.pseudo,
    });
    this.logger.log(
      `[Chat WebSockets] Émission de reactionAdded : messageId=${body.messageId}, emoji=${body.emoji}`,
    );
  }

  /**
   * Suppression d'un message en temps réel
   */
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string },
  ) {
    if (!client.data.pseudo || !body.messageId) return;

    this.logger.log(
      `[Chat WebSockets] Demande de suppression : pseudo=${client.data.pseudo}, messageId=${body.messageId}`,
    );

    // Fonction helper pour chercher et supprimer dans un historique
    const filterOut = (arr: any[]): boolean => {
      const idx = arr.findIndex((m) => m.id === body.messageId);
      if (idx !== -1) {
        const msg = arr[idx];
        if (msg.sender === client.data.pseudo || client.data.role === 'ADMIN') {
          arr.splice(idx, 1);
          return true;
        }
      }
      return false;
    };

    // 1. Chercher dans global
    if (filterOut(this.globalHistory)) {
      this.server.emit('msgDeleted', { messageId: body.messageId });
      this.logger.log(
        `[Chat WebSockets] Message global supprimé : ${body.messageId}`,
      );
      return;
    }

    // 2. Chercher dans les équipes
    for (const [_, msgs] of this.teamHistories) {
      if (filterOut(msgs)) {
        this.server.emit('msgDeleted', { messageId: body.messageId });
        this.logger.log(
          `[Chat WebSockets] Message d'équipe supprimé : ${body.messageId}`,
        );
        return;
      }
    }

    // 3. Chercher dans les privés
    for (const [_, msgs] of this.privateHistories) {
      if (filterOut(msgs)) {
        this.server.emit('msgDeleted', { messageId: body.messageId });
        this.logger.log(
          `[Chat WebSockets] Message privé supprimé : ${body.messageId}`,
        );
        return;
      }
    }
  }

  /**
   * Modification d'un message en temps réel
   */
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string; text: string },
  ) {
    if (!client.data.pseudo || !body.messageId || !body.text) return;

    this.logger.log(
      `[Chat WebSockets] Demande de modification : pseudo=${client.data.pseudo}, messageId=${body.messageId}`,
    );

    const sanitizedText = this.sanitize(body.text);
    if (!sanitizedText || sanitizedText.trim() === '') return;

    // Fonction helper pour chercher et modifier dans un historique
    const updateInHistory = (arr: any[]): boolean => {
      const idx = arr.findIndex((m) => m.id === body.messageId);
      if (idx !== -1) {
        const msg = arr[idx];
        if (msg.sender === client.data.pseudo || client.data.role === 'ADMIN') {
          msg.content = sanitizedText;
          msg.isEdited = true;
          return true;
        }
      }
      return false;
    };

    // 1. Chercher dans global
    if (updateInHistory(this.globalHistory)) {
      this.server.emit('msgEdited', {
        messageId: body.messageId,
        content: sanitizedText,
        isEdited: true,
      });
      this.logger.log(
        `[Chat WebSockets] Message global modifié : ${body.messageId}`,
      );
      return;
    }

    // 2. Chercher dans les équipes
    for (const [_, msgs] of this.teamHistories) {
      if (updateInHistory(msgs)) {
        this.server.emit('msgEdited', {
          messageId: body.messageId,
          content: sanitizedText,
          isEdited: true,
        });
        this.logger.log(
          `[Chat WebSockets] Message d'équipe modifié : ${body.messageId}`,
        );
        return;
      }
    }

    // 3. Chercher dans les privés
    for (const [_, msgs] of this.privateHistories) {
      if (updateInHistory(msgs)) {
        this.server.emit('msgEdited', {
          messageId: body.messageId,
          content: sanitizedText,
          isEdited: true,
        });
        this.logger.log(
          `[Chat WebSockets] Message privé modifié : ${body.messageId}`,
        );
        return;
      }
    }
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

    // Enregistrer dans l'historique global
    this.addToHistory(this.globalHistory, alertData);

    this.server.to('global').emit('msgGlobal', alertData);
  }

  /**
   * Rate limiting : Maximum 3 messages toutes les 5 secondes par client
   */
  private isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.clientMessageTimestamps.get(clientId) || [];

    // Filtrer les timestamps de plus de 5 secondes
    const recentTimestamps = timestamps.filter((ts) => now - ts < 5000);

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

  /**
   * Bascule du Mode Furtif (Invisible) pour le client connecté
   */
  @SubscribeMessage('setStealthMode')
  async handleSetStealthMode(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { isStealth: boolean },
  ) {
    client.data.isStealth = Boolean(body?.isStealth);
    this.logger.log(
      `[Chat WebSockets] Mode Furtif ${client.data.isStealth ? 'ACTIVÉ' : 'DÉSACTIVÉ'} pour ${client.data.pseudo}`,
    );
    this.broadcastOnlineUsers();
  }

  /**
   * Diffuse la liste des pseudos connectés à tous les clients (hors utilisateurs en mode furtif)
   */
  private async broadcastOnlineUsers() {
    try {
      const sockets = await this.server.fetchSockets();
      const onlinePseudos = sockets
        .filter((s) => !s.data.isStealth)
        .map((s) => s.data.pseudo)
        .filter((pseudo): pseudo is string => !!pseudo);

      const uniquePseudos = Array.from(new Set(onlinePseudos));
      this.server.emit('onlineUsersUpdate', uniquePseudos);
    } catch (err) {
      this.logger.error(
        `[Chat WebSockets] Erreur lors de la diffusion des utilisateurs en ligne : ${err.message}`,
      );
    }
  }

  private addToHistory(history: any[], message: any, limit = 100) {
    history.push(message);
    if (history.length > limit) {
      history.shift();
    }
  }

  private addReactionToHistory(
    messageId: string,
    emoji: string,
    username: string,
  ) {
    const updateMessage = (msg: any) => {
      if (msg.id === messageId) {
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.find((r: any) => r.emoji === emoji);
        if (existing) {
          const userIndex = existing.users.indexOf(username);
          if (userIndex >= 0) {
            existing.users.splice(userIndex, 1);
            existing.count = existing.users.length;
          } else {
            existing.users.push(username);
            existing.count = existing.users.length;
          }
          msg.reactions = msg.reactions.filter((r: any) => r.count > 0);
        } else {
          msg.reactions.push({ emoji, count: 1, users: [username] });
        }
        return true;
      }
      return false;
    };

    for (const msg of this.globalHistory) {
      if (updateMessage(msg)) return;
    }
    for (const teamMsgs of this.teamHistories.values()) {
      for (const msg of teamMsgs) {
        if (updateMessage(msg)) return;
      }
    }
    for (const privateMsgs of this.privateHistories.values()) {
      for (const msg of privateMsgs) {
        if (updateMessage(msg)) return;
      }
    }
  }
}
