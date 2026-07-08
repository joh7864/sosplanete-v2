import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '../types/evoe';
import { useAuth } from '../context/AuthContext';

const getSocketUrl = () => {
  const evoeApiUrl = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';
  return evoeApiUrl.replace(/\/evoe\/?$/, '');
};

interface UseChatSocketProps {
  isOpen: boolean;
  activeTab: string;
  teams: any[];
  onOnlineUsersChange?: (users: Set<string>) => void;
}

export function useChatSocket({
  isOpen,
  activeTab,
  teams,
  onOnlineUsersChange
}: UseChatSocketProps) {
  const { childInfos, players, instanceId } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const [unreadSystem, setUnreadSystem] = useState(0);
  const [unreadMps, setUnreadMps] = useState<Record<string, number>>({});
  const [unreadTeams, setUnreadTeams] = useState<Record<string, number>>({});

  const savedAuth = localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
  const myPseudo = childInfos?.pseudo || '';
  const myPseudoRef = useRef(myPseudo);
  const myTeamNameRef = useRef('');

  useEffect(() => {
    myPseudoRef.current = myPseudo;
  }, [myPseudo]);

  useEffect(() => {
    const currentPlayer = (players || []).find(p => p.id === childInfos?.id || p.childId === childInfos?.id);
    const myTeamId = currentPlayer?.teamId || currentPlayer?.team?.id;
    const myTeam = (teams || []).find((t: any) => t.id === myTeamId);
    myTeamNameRef.current = myTeam?.name || '';
  }, [players, teams, childInfos?.id]);

  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!savedAuth) return;

    const socketUrl = getSocketUrl();
    const socketInstance = io(`${socketUrl}/chat`, {
      auth: { token: savedAuth },
      query: { instanceId: instanceId || '' }
    });

    socketInstance.on('connect', () => {
      console.log('[Chat WebSockets] Connecté au serveur');
      setMessages(prev => [
        ...prev,
        {
          id: 'conn-' + Date.now(),
          sender: 'NEXUS SYSTEM',
          role: 'SYSTEM',
          content: 'Liaison Comm-Link établie avec succès. Cryptage quantique actif.',
          timestamp: new Date()
        }
      ]);
    });

    socketInstance.on('msgDeleted', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socketInstance.on('msgEdited', ({ messageId, content, isEdited }: { messageId: string; content: string; isEdited: boolean }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, isEdited } : m));
    });

    socketInstance.on('onlineUsersUpdate', (pseudos: string[]) => {
      const lowerPseudos = pseudos.map(p => p.toLowerCase());
      onOnlineUsersChange?.(new Set(lowerPseudos));
    });

    socketInstance.on('msgGlobal', (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, channel: 'global' }]);
      if (!isOpenRef.current || activeTabRef.current !== (msg.role === 'SYSTEM' ? 'system' : 'global')) {
        if (msg.role === 'SYSTEM') {
          setUnreadSystem(u => u + 1);
        } else {
          setUnreadGlobal(u => u + 1);
        }
      }
    });

    socketInstance.on('msgTeam', (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, channel: 'team' }]);
      if (!isOpenRef.current || activeTabRef.current !== 'team') {
        setUnreadTeam(u => u + 1);
      }
    });

    socketInstance.on('msgPrivate', (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, isPrivate: true }]);
      const senderLower = msg.sender.toLowerCase();
      const myPseudoLower = myPseudoRef.current.toLowerCase();
      if (senderLower !== myPseudoLower) {
        const isActive = isOpenRef.current && activeTabRef.current === `mp:${senderLower}`;
        if (!isActive) {
          setUnreadMps(prev => ({
            ...prev,
            [senderLower]: (prev[senderLower] || 0) + 1
          }));
        }
      }
    });

    socketInstance.on('msgPrivateTeam', (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, isPrivate: true }]);
      const myTeamNameLower = myTeamNameRef.current.toLowerCase();
      if (msg.teamName && msg.teamName.toLowerCase() !== myTeamNameLower) {
        const fromTeamLower = msg.teamName.toLowerCase();
        const isActive = isOpenRef.current && activeTabRef.current === `team:${fromTeamLower}`;
        if (!isActive) {
          setUnreadTeams(prev => ({
            ...prev,
            [fromTeamLower]: (prev[fromTeamLower] || 0) + 1
          }));
        }
      }
    });

    socketInstance.on('chatHistory', (history: { global: ChatMessage[]; team: ChatMessage[]; private: ChatMessage[] }) => {
      const globalMsgs = (history.global || []).map(m => ({ ...m, channel: 'global' as const }));
      const teamMsgs = (history.team || []).map(m => ({ ...m, channel: 'team' as const }));
      const privateMsgs = (history.private || []).map(m => ({ ...m, isPrivate: true }));
      
      const combined = [...globalMsgs, ...teamMsgs, ...privateMsgs].map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(prev => {
        const prevIds = new Set(prev.map(p => p.id));
        const filteredNew = combined.filter(m => !prevIds.has(m.id));
        return [...prev, ...filteredNew];
      });
    });

    socketInstance.on('reactionAdded', (data: { messageId: string; emoji: string; username: string }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id !== data.messageId) return msg;
        const currentReactions = msg.reactions || [];
        const existingReaction = currentReactions.find(r => r.emoji === data.emoji);

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
            newReactions = currentReactions.filter(r => r.emoji !== data.emoji);
          } else {
            newReactions = currentReactions.map(r => r.emoji === data.emoji ? { ...r, users: newUsers, count: newUsers.length } : r);
          }
        } else {
          newReactions = [...currentReactions, { emoji: data.emoji, count: 1, users: [data.username] }];
        }

        return { ...msg, reactions: newReactions };
      }));
    });

    socketInstance.on('chatError', (errText: string) => {
      setErrorMsg(errText);
      setTimeout(() => setErrorMsg(null), 5000);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Chat WebSockets] Déconnecté du serveur');
      setMessages(prev => [
        ...prev,
        {
          id: 'disc-' + Date.now(),
          sender: 'NEXUS SYSTEM',
          role: 'SYSTEM',
          content: 'Liaison Comm-Link interrompue. Tentative de reconnexion...',
          timestamp: new Date()
        }
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
      socketInstance.off('disconnect');
      socketInstance.disconnect();
    };
  }, [savedAuth, onOnlineUsersChange, instanceId]);

  return {
    socket,
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
    setUnreadTeams
  };
}
