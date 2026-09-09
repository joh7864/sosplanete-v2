import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '../types/evoe';
import { useAuth } from '../context/AuthContext';

const getSocketUrl = () => {
  const evoeApiUrl = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';
  return evoeApiUrl.replace(/\/evoe\/?$/, '');
};

interface LastReadTimestamps {
  global: number;
  team: number;
  system: number;
  mps: Record<string, number>;
  teams: Record<string, number>;
}

function getLastRead(pseudo: string): LastReadTimestamps {
  if (!pseudo) return { global: 0, team: 0, system: 0, mps: {}, teams: {} };
  try {
    const raw = localStorage.getItem(`evoe_chat_last_read_v1_${pseudo.toLowerCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        global: parsed.global || 0,
        team: parsed.team || 0,
        system: parsed.system || 0,
        mps: parsed.mps || {},
        teams: parsed.teams || {},
      };
    }
  } catch {
    // ignore
  }
  return { global: 0, team: 0, system: 0, mps: {}, teams: {} };
}

function saveLastRead(
  pseudo: string,
  tab: string,
  timestamp: number = Date.now(),
) {
  if (!pseudo) return;
  try {
    const current = getLastRead(pseudo);
    if (tab === 'global' || tab === 'team' || tab === 'system') {
      current[tab] = timestamp;
    } else if (tab.startsWith('mp:')) {
      const target = tab.substring(3).toLowerCase();
      if (!current.mps) current.mps = {};
      current.mps[target] = timestamp;
    } else if (tab.startsWith('team:')) {
      const target = tab.substring(5).toLowerCase();
      if (!current.teams) current.teams = {};
      current.teams[target] = timestamp;
    }
    localStorage.setItem(`evoe_chat_last_read_v1_${pseudo.toLowerCase()}`, JSON.stringify(current));
  } catch {
    // ignore
  }
}

function computeUnreadCounts(
  allMessages: ChatMessage[],
  pseudo: string,
  myTeamName: string,
  isOpen: boolean,
  activeTab: string,
) {
  if (!pseudo) {
    return {
      unreadGlobal: 0,
      unreadTeam: 0,
      unreadSystem: 0,
      unreadMps: {},
      unreadTeams: {},
    };
  }

  const pseudoLower = pseudo.toLowerCase();
  const myTeamNameLower = (myTeamName || '').toLowerCase();

  // Si le chat est ouvert, le canal actuellement affiché est marqué comme lu
  if (isOpen) {
    saveLastRead(pseudoLower, activeTab);
  }

  const lastRead = getLastRead(pseudoLower);

  let unreadGlobal = 0;
  let unreadTeam = 0;
  let unreadSystem = 0;
  const unreadMps: Record<string, number> = {};
  const unreadTeams: Record<string, number> = {};

  const now = Date.now();
  const maxHistoryAgeTeam = 48 * 3600 * 1000;
  const maxHistoryAgeGlobal = 2 * 3600 * 1000;

  // Timestamp du dernier message envoyé par l'utilisateur lui-même dans l'équipe
  const myTeamMessages = allMessages.filter(
    (m) => m.channel === 'team' && m.sender?.toLowerCase() === pseudoLower,
  );
  const lastSentByMeInTeam =
    myTeamMessages.length > 0
      ? Math.max(...myTeamMessages.map((m) => new Date(m.timestamp).getTime()))
      : 0;

  const myGlobalMessages = allMessages.filter(
    (m) => m.channel === 'global' && m.sender?.toLowerCase() === pseudoLower,
  );
  const lastSentByMeInGlobal =
    myGlobalMessages.length > 0
      ? Math.max(...myGlobalMessages.map((m) => new Date(m.timestamp).getTime()))
      : 0;

  for (const m of allMessages) {
    const senderLower = (m.sender || '').toLowerCase();
    const isFromMe = senderLower === pseudoLower;
    const msgTime = new Date(m.timestamp).getTime();

    // 1. Canal Équipe
    if (m.channel === 'team') {
      if (isFromMe) continue;
      if (isOpen && activeTab === 'team') continue;

      const cutoff = Math.max(lastRead.team || 0, lastSentByMeInTeam);
      if (cutoff === 0) {
        if (now - msgTime < maxHistoryAgeTeam) {
          unreadTeam++;
        }
      } else if (msgTime > cutoff) {
        unreadTeam++;
      }
    }
    // 2. Canal Global
    else if (m.channel === 'global' && m.role !== 'SYSTEM') {
      if (isFromMe) continue;
      if (isOpen && activeTab === 'global') continue;

      const cutoff = Math.max(lastRead.global || 0, lastSentByMeInGlobal);
      if (cutoff === 0) {
        if (now - msgTime < maxHistoryAgeGlobal) {
          unreadGlobal++;
        }
      } else if (msgTime > cutoff) {
        unreadGlobal++;
      }
    }
    // 3. Canal Système
    else if (m.role === 'SYSTEM') {
      if (isOpen && activeTab === 'system') continue;
      const cutoff = lastRead.system || 0;
      if (cutoff > 0 && msgTime > cutoff) {
        unreadSystem++;
      }
    }
    // 4. Messages Privés (MP joueur ou salon d'équipe privée)
    else if (m.isPrivate) {
      if (isFromMe) continue;

      if (m.teamName && m.teamName.toLowerCase() !== myTeamNameLower) {
        // Inter-équipes
        const fromTeamLower = m.teamName.toLowerCase();
        if (isOpen && activeTab === `team:${fromTeamLower}`) continue;
        const cutoff = lastRead.teams?.[fromTeamLower] || 0;
        if (cutoff === 0) {
          if (now - msgTime < maxHistoryAgeTeam) {
            unreadTeams[fromTeamLower] = (unreadTeams[fromTeamLower] || 0) + 1;
          }
        } else if (msgTime > cutoff) {
          unreadTeams[fromTeamLower] = (unreadTeams[fromTeamLower] || 0) + 1;
        }
      } else {
        // MP direct joueur
        if (isOpen && activeTab === `mp:${senderLower}`) continue;
        const cutoff = lastRead.mps?.[senderLower] || 0;
        if (cutoff === 0) {
          if (now - msgTime < maxHistoryAgeTeam) {
            unreadMps[senderLower] = (unreadMps[senderLower] || 0) + 1;
          }
        } else if (msgTime > cutoff) {
          unreadMps[senderLower] = (unreadMps[senderLower] || 0) + 1;
        }
      }
    }
  }

  return {
    unreadGlobal,
    unreadTeam,
    unreadSystem,
    unreadMps,
    unreadTeams,
  };
}

interface UseChatSocketProps {
  isOpen: boolean;
  activeTab: string;
  teams: any[];
  onOnlineUsersChange?: (users: Set<string>) => void;
  isStealthMode?: boolean;
}

export function useChatSocket({
  isOpen,
  activeTab,
  teams,
  onOnlineUsersChange,
  isStealthMode,
}: UseChatSocketProps) {
  const { childInfos, players, instanceId, pseudo } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const [unreadSystem, setUnreadSystem] = useState(0);
  const [unreadMps, setUnreadMps] = useState<Record<string, number>>({});
  const [unreadTeams, setUnreadTeams] = useState<Record<string, number>>({});

  const savedToken =
    localStorage.getItem('evoe_token') ||
    sessionStorage.getItem('evoe_token') ||
    localStorage.getItem('evoe_auth') ||
    sessionStorage.getItem('evoe_auth');

  const myPseudo = childInfos?.pseudo || pseudo || '';
  const myPseudoRef = useRef(myPseudo);
  const myTeamNameRef = useRef('');

  useEffect(() => {
    if (socket && typeof isStealthMode === 'boolean') {
      socket.emit('setStealthMode', { isStealth: isStealthMode });
    }
  }, [socket, isStealthMode]);

  useEffect(() => {
    myPseudoRef.current = myPseudo;
    if (myPseudo && messages.length > 0) {
      const counts = computeUnreadCounts(
        messages,
        myPseudo,
        myTeamNameRef.current,
        isOpenRef.current,
        activeTabRef.current,
      );
      setUnreadGlobal(counts.unreadGlobal);
      setUnreadTeam(counts.unreadTeam);
      setUnreadSystem(counts.unreadSystem);
      setUnreadMps(counts.unreadMps);
      setUnreadTeams(counts.unreadTeams);
    }
  }, [myPseudo]);

  useEffect(() => {
    const currentPlayer = (players || []).find(
      (p) => p.id === childInfos?.id || p.childId === childInfos?.id,
    );
    const myTeamId = currentPlayer?.teamId || currentPlayer?.team?.id;
    const myTeam = (teams || []).find((t: any) => t.id === myTeamId);
    myTeamNameRef.current = myTeam?.name || '';
  }, [players, teams, childInfos?.id]);

  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen && myPseudo) {
      saveLastRead(myPseudo, activeTab);
      const counts = computeUnreadCounts(
        messages,
        myPseudo,
        myTeamNameRef.current,
        isOpen,
        activeTab,
      );
      setUnreadGlobal(counts.unreadGlobal);
      setUnreadTeam(counts.unreadTeam);
      setUnreadSystem(counts.unreadSystem);
      setUnreadMps(counts.unreadMps);
      setUnreadTeams(counts.unreadTeams);
    }
  }, [isOpen]);

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (isOpen && myPseudo) {
      saveLastRead(myPseudo, activeTab);
      const counts = computeUnreadCounts(
        messages,
        myPseudo,
        myTeamNameRef.current,
        isOpen,
        activeTab,
      );
      setUnreadGlobal(counts.unreadGlobal);
      setUnreadTeam(counts.unreadTeam);
      setUnreadSystem(counts.unreadSystem);
      setUnreadMps(counts.unreadMps);
      setUnreadTeams(counts.unreadTeams);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!savedToken) return;

    const socketUrl = getSocketUrl();
    const isStealthSaved = localStorage.getItem('evoe_stealth_mode') === 'true';
    const socketInstance = io(`${socketUrl}/chat`, {
      auth: { token: savedToken, isStealth: isStealthSaved },
      query: { instanceId: instanceId || '', isStealth: String(isStealthSaved) },
    });

    socketInstance.on('connect', () => {
      console.log('[Chat WebSockets] Connecté au serveur');
      setMessages((prev) => [
        ...prev,
        {
          id: 'conn-' + Date.now(),
          sender: 'NEXUS SYSTEM',
          role: 'SYSTEM',
          content: 'Liaison Comm-Link établie avec succès. Cryptage quantique actif.',
          timestamp: new Date(),
        },
      ]);
    });

    socketInstance.on('msgDeleted', ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socketInstance.on(
      'msgEdited',
      ({
        messageId,
        content,
        isEdited,
      }: {
        messageId: string;
        content: string;
        isEdited: boolean;
      }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, content, isEdited } : m)),
        );
      },
    );

    socketInstance.on('onlineUsersUpdate', (pseudos: string[]) => {
      const lowerPseudos = pseudos.map((p) => p.toLowerCase());
      onOnlineUsersChange?.(new Set(lowerPseudos));
    });

    socketInstance.on('msgGlobal', (msg: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, { ...msg, channel: 'global' as const }];
        const pseudoToUse = myPseudoRef.current;
        if (pseudoToUse) {
          const counts = computeUnreadCounts(
            updated,
            pseudoToUse,
            myTeamNameRef.current,
            isOpenRef.current,
            activeTabRef.current,
          );
          setUnreadGlobal(counts.unreadGlobal);
          setUnreadTeam(counts.unreadTeam);
          setUnreadSystem(counts.unreadSystem);
          setUnreadMps(counts.unreadMps);
          setUnreadTeams(counts.unreadTeams);
        }
        return updated;
      });
    });

    socketInstance.on('msgTeam', (msg: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, { ...msg, channel: 'team' as const }];
        const pseudoToUse = myPseudoRef.current;
        if (pseudoToUse) {
          const counts = computeUnreadCounts(
            updated,
            pseudoToUse,
            myTeamNameRef.current,
            isOpenRef.current,
            activeTabRef.current,
          );
          setUnreadGlobal(counts.unreadGlobal);
          setUnreadTeam(counts.unreadTeam);
          setUnreadSystem(counts.unreadSystem);
          setUnreadMps(counts.unreadMps);
          setUnreadTeams(counts.unreadTeams);
        }
        return updated;
      });
    });

    socketInstance.on('msgPrivate', (msg: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, { ...msg, isPrivate: true }];
        const pseudoToUse = myPseudoRef.current;
        if (pseudoToUse) {
          const counts = computeUnreadCounts(
            updated,
            pseudoToUse,
            myTeamNameRef.current,
            isOpenRef.current,
            activeTabRef.current,
          );
          setUnreadGlobal(counts.unreadGlobal);
          setUnreadTeam(counts.unreadTeam);
          setUnreadSystem(counts.unreadSystem);
          setUnreadMps(counts.unreadMps);
          setUnreadTeams(counts.unreadTeams);
        }
        return updated;
      });
    });

    socketInstance.on('msgPrivateTeam', (msg: ChatMessage) => {
      setMessages((prev) => {
        const updated = [...prev, { ...msg, isPrivate: true }];
        const pseudoToUse = myPseudoRef.current;
        if (pseudoToUse) {
          const counts = computeUnreadCounts(
            updated,
            pseudoToUse,
            myTeamNameRef.current,
            isOpenRef.current,
            activeTabRef.current,
          );
          setUnreadGlobal(counts.unreadGlobal);
          setUnreadTeam(counts.unreadTeam);
          setUnreadSystem(counts.unreadSystem);
          setUnreadMps(counts.unreadMps);
          setUnreadTeams(counts.unreadTeams);
        }
        return updated;
      });
    });

    socketInstance.on(
      'chatHistory',
      (history: {
        global: ChatMessage[];
        team: ChatMessage[];
        private: ChatMessage[];
      }) => {
        const globalMsgs = (history.global || []).map((m) => ({
          ...m,
          channel: 'global' as const,
        }));
        const teamMsgs = (history.team || []).map((m) => ({
          ...m,
          channel: 'team' as const,
        }));
        const privateMsgs = (history.private || []).map((m) => ({
          ...m,
          isPrivate: true,
        }));

        const combined = [...globalMsgs, ...teamMsgs, ...privateMsgs].map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setMessages((prev) => {
          const prevIds = new Set(prev.map((p) => p.id));
          const filteredNew = combined.filter((m) => !prevIds.has(m.id));
          const allNew = [...prev, ...filteredNew];

          const pseudoToUse = myPseudoRef.current;
          if (pseudoToUse) {
            const counts = computeUnreadCounts(
              allNew,
              pseudoToUse,
              myTeamNameRef.current,
              isOpenRef.current,
              activeTabRef.current,
            );
            setUnreadGlobal(counts.unreadGlobal);
            setUnreadTeam(counts.unreadTeam);
            setUnreadSystem(counts.unreadSystem);
            setUnreadMps(counts.unreadMps);
            setUnreadTeams(counts.unreadTeams);
          }

          return allNew;
        });
      },
    );

    socketInstance.on(
      'reactionAdded',
      (data: { messageId: string; emoji: string; username: string }) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== data.messageId) return msg;
            const currentReactions = msg.reactions || [];
            const existingReaction = currentReactions.find((r) => r.emoji === data.emoji);

            let newReactions;
            if (existingReaction) {
              const userIndex = existingReaction.users.indexOf(data.username);
              let newUsers = [...existingReaction.users];
              if (userIndex >= 0) {
                newUsers.splice(userIndex, 1);
              } else {
                newUsers.push(data.username);
              }

              if (newUsers.length === 0) {
                newReactions = currentReactions.filter((r) => r.emoji !== data.emoji);
              } else {
                newReactions = currentReactions.map((r) =>
                  r.emoji === data.emoji
                    ? { ...r, users: newUsers, count: newUsers.length }
                    : r,
                );
              }
            } else {
              newReactions = [
                ...currentReactions,
                { emoji: data.emoji, count: 1, users: [data.username] },
              ];
            }

            return { ...msg, reactions: newReactions };
          }),
        );
      },
    );

    socketInstance.on('chatError', (errText: string) => {
      setErrorMsg(errText);
      setTimeout(() => setErrorMsg(null), 5000);
    });

    socketInstance.on('easter_egg_team_victory', (data: any) => {
      console.log('[WebSockets] 🏆 Victoire Easter Egg d’équipe reçue:', data);
      window.dispatchEvent(new CustomEvent('easter_egg_team_victory', { detail: data }));
    });

    socketInstance.on('disconnect', () => {
      console.log('[Chat WebSockets] Déconnecté du serveur');
      setMessages((prev) => [
        ...prev,
        {
          id: 'disc-' + Date.now(),
          sender: 'NEXUS SYSTEM',
          role: 'SYSTEM',
          content: 'Liaison Comm-Link interrompue. Tentative de reconnexion...',
          timestamp: new Date(),
        },
      ]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect');
      socketInstance.off('msgDeleted');
      socketInstance.off('msgEdited');
      socketInstance.off('onlineUsersUpdate');
      socketInstance.off('msgGlobal');
      socketInstance.off('msgTeam');
      socketInstance.off('msgPrivate');
      socketInstance.off('msgPrivateTeam');
      socketInstance.off('chatHistory');
      socketInstance.off('reactionAdded');
      socketInstance.off('chatError');
      socketInstance.off('easter_egg_team_victory');
      socketInstance.off('disconnect');
      socketInstance.disconnect();
    };
  }, [savedToken, onOnlineUsersChange, instanceId]);

  const emitStealthMode = (isStealth: boolean) => {
    if (socket) {
      socket.emit('setStealthMode', { isStealth });
    }
  };

  return {
    socket,
    emitStealthMode,
    messages,
    setMessages,
    errorMsg,
    setErrorMsg,
    unreadGlobal,
    setUnreadGlobal,
    unreadTeam,
    setUnreadTeam,
    unreadSystem,
    setUnreadSystem,
    unreadMps,
    setUnreadMps,
    unreadTeams,
    setUnreadTeams,
  };
}
