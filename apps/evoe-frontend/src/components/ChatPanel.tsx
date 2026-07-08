import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Shield, AlertTriangle, Send, X, Terminal, Radio, Info, Maximize2, Minimize2, Menu, Mail, ChevronDown, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: string;
  role: 'CHILD' | 'ADMIN' | 'SYSTEM';
  teamName?: string;
  targetTeamName?: string;
  targetPseudo?: string;
  content: string;
  isPrivate?: boolean;
  timestamp: string | Date;
  channel?: 'global' | 'team';
  reactions?: { emoji: string; count: number; users: string[] }[];
  parentId?: string | null;
  isEdited?: boolean;
}

interface ChatPanelProps {
  players?: any[];
  teams?: any[];
  onlineUsers?: Set<string>;
  onOnlineUsersChange?: (users: Set<string>) => void;
  onUnreadChange?: (unreadInfo: {
    global: number;
    team: number;
    system: number;
    unreadMps: Record<string, number>;
    unreadTeams: Record<string, number>;
    total: number;
  }) => void;
  isOpenProp?: boolean;
  activeTabProp?: string;
  onClose?: () => void;
  onOpen?: () => void;
  onTabChange?: (tab: string) => void;
}

export default function ChatPanel({ 
  players = [], 
  teams = [], 
  onlineUsers = new Set(), 
  onOnlineUsersChange,
  onUnreadChange,
  isOpenProp,
  activeTabProp,
  onClose,
  onOpen,
  onTabChange
}: ChatPanelProps) {
  const { childInfos, instanceId, user } = useAuth();
  // Composant entièrement contrôlé depuis App.tsx via isOpenProp
  const isOpen = isOpenProp ?? false;
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('global');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fermer : on délègue entièrement à App.tsx via onClose
  const changeIsOpen = (open: boolean) => {
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const changeActiveTab = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Touch gestures to close Bottom Sheet on mobile (Swipe Down)
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diffY = touchEndY.current - touchStartY.current;
    if (diffY > 80) {
      changeIsOpen(false);
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const [unreadMps, setUnreadMps] = useState<Record<string, number>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyInputTexts, setReplyInputTexts] = useState<Record<string, string>>({});
  const [unreadSystem, setUnreadSystem] = useState(0);
  const [unreadTeams, setUnreadTeams] = useState<Record<string, number>>({});
  
  // Collapse/Expand state for Discord-like channel sections
  const [isGroup1Expanded, setIsGroup1Expanded] = useState(true);
  const [isGroup2Expanded, setIsGroup2Expanded] = useState(true);
  const [isGroup3Expanded, setIsGroup3Expanded] = useState(true);

  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Refs pour les callbacks WebSocket (évite les stale closures)
  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    if (activeTabProp !== undefined && activeTab !== activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);




  // Suggestions state for auto-completion
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<'mention' | 'command' | null>(null);
  const [suggestionTriggerIndex, setSuggestionTriggerIndex] = useState(-1);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const savedAuth = localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
  const myPseudo = childInfos?.pseudo || '';
  const myPseudoRef = useRef(myPseudo);
  useEffect(() => {
    myPseudoRef.current = myPseudo;
  }, [myPseudo]);
  const currentPlayer = (players || []).find(p => p.id === childInfos?.id || p.childId === childInfos?.id);
  const myTeamId = currentPlayer?.teamId || currentPlayer?.team?.id;
  const myTeam = (teams || []).find(t => t.id === myTeamId);
  const myTeamName = myTeam?.name || '';
  const myTeamNameRef = useRef(myTeamName);
  useEffect(() => {
    myTeamNameRef.current = myTeamName;
  }, [myTeamName]);
  const myTeamColor = myTeam?.color || '#00b3ff';

  const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

  const getAvatarUrl = (msg: ChatMessage) => {
    if (msg.role === 'SYSTEM' || msg.role === 'ADMIN') {
      return null;
    }

    const player = (players || []).find(p => p.pseudo.toLowerCase() === msg.sender.toLowerCase());
    const avatarValue = player?.avatar || null;
    const genderValue = player?.gender || null;

    if (avatarValue && avatarValue !== 'avatars/default.png') {
      return `${EVOE_IMG_URL}${avatarValue}`;
    }

    const hash = msg.sender.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let file = '';
    const gender = genderValue || 'H';
    if (gender === 'EF') file = `EF_avatar_0${(hash % 3) + 1}.png`;
    else if (gender === 'EH') file = `EH_avatar_0${(hash % 3) + 1}.png`;
    else if (gender === 'F') file = `F_avatar_${((hash % 12) + 1).toString().padStart(2, '0')}.png`;
    else file = `H_avatar_0${(hash % 21) + 1}.png`;
    
    return `${EVOE_IMG_URL}avatars_3D/${file}`;
  };

  // Get WebSocket Server URL based on API URL
  const getSocketUrl = () => {
    const evoeApiUrl = import.meta.env.VITE_EVOE_API_URL || 'http://localhost:3011/evoe';
    return evoeApiUrl.replace(/\/evoe\/?$/, '');
  };

  const decodeHtmlEntities = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/');
  };

  const formatMentions = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(@[\wÀ-ÿ-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const mentionName = part.substring(1).toLowerCase();
        const isMe = mentionName === myPseudo.toLowerCase();
        const isMyTeam = myTeamName && mentionName === myTeamName.toLowerCase();
        const playerExists = (players || []).some(p => p.pseudo?.toLowerCase() === mentionName);
        const teamExists = (teams || []).some(t => t.name?.toLowerCase() === mentionName);

        if (playerExists || teamExists || isMe || isMyTeam) {
          const color = (isMe || isMyTeam) ? '#ffd700' : '#00b3ff';
          const bg = (isMe || isMyTeam) ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 179, 255, 0.15)';
          return (
            <span
              key={index}
              style={{
                color,
                background: bg,
                padding: '0px 4px',
                borderRadius: '3px',
                fontWeight: 'bold',
                display: 'inline-block',
                wordBreak: 'break-all'
              }}
            >
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };


  useEffect(() => {
    if (!savedAuth) return;

    const socketUrl = getSocketUrl();
    const socketInstance = io(`${socketUrl}/chat`, {
      auth: {
        token: savedAuth
      },
      query: {
        instanceId: instanceId || ''
      }
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
      
      // Update unread count if panel is closed or tab is not active
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

    // Global keyboard listener to toggle / focus chat
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === '/') && document.activeElement !== inputRef.current) {
        const activeEl = document.activeElement;
        const isInputField = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true');
        if (!isInputField) {
          e.preventDefault();
          changeIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      socketInstance.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      onOnlineUsersChange?.(new Set());
    };
  }, [savedAuth, onOnlineUsersChange]);

  // Clear unreads when tab changes or chat opens
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'global') setUnreadGlobal(0);
      if (activeTab === 'team') setUnreadTeam(0);
      if (activeTab === 'system') setUnreadSystem(0);
      if (activeTab.startsWith('mp:')) {
        const target = activeTab.substring(3).toLowerCase();
        setUnreadMps(prev => {
          if (prev[target]) {
            const next = { ...prev };
            delete next[target];
            return next;
          }
          return prev;
        });
      }
      if (activeTab.startsWith('team:')) {
        const target = activeTab.substring(5).toLowerCase();
        setUnreadTeams(prev => {
          if (prev[target]) {
            const next = { ...prev };
            delete next[target];
            return next;
          }
          return prev;
        });
      }
    }
  }, [isOpen, activeTab]);

  // Auto-scroll to bottom of messages (skipped for system tab since system logs are sorted newest-first at top)
  useEffect(() => {
    if (activeTab !== 'system') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputText.trim()) return;

    // Détecter si le message commence par une commande de type /destinataire
    let shouldSend = true;
    if (inputText.startsWith('/')) {
      const parts = inputText.trim().split(/\s+/);
      const command = parts[0].substring(1).toLowerCase(); // ex: 'isabeller' ou 'alpha'
      
      const targetPlayer = (players || []).find(p => p.pseudo.toLowerCase() === command);
      const targetTeam = (teams || []).find(t => t.name && t.name.toLowerCase() === command);
      
      if (targetPlayer || targetTeam) {
        if (targetPlayer) {
          changeActiveTab(`mp:${command}`);
        } else if (targetTeam) {
          if (command === myTeamName.toLowerCase()) {
            changeActiveTab('team');
          } else {
            changeActiveTab(`team:${command}`);
          }
        }
        
        // S'il n'y a pas de message après la commande, on change juste de salon sans émettre au serveur
        if (parts.length === 1) {
          shouldSend = false;
        }
      }
    }

    if (shouldSend) {
      if (activeTab === 'global' || inputText.startsWith('/')) {
        // Si l'utilisateur commence par un slash, on émet tel quel (le serveur gère le parsing)
        socket.emit('sendGlobal', { text: inputText });
      } else if (activeTab === 'team') {
        socket.emit('sendTeam', { text: inputText });
      } else if (activeTab.startsWith('mp:')) {
        const target = activeTab.split(':')[1];
        socket.emit('sendGlobal', { text: `/${target} ${inputText}` });
      } else if (activeTab.startsWith('team:')) {
        const target = activeTab.split(':')[1];
        socket.emit('sendGlobal', { text: `/${target} ${inputText}` });
      } else {
        setErrorMsg("Impossible d'émettre sur le canal système.");
        setTimeout(() => setErrorMsg(null), 3000);
        return;
      }
    }

    setInputText('');
    setSuggestions([]);
    setSuggestionType(null);
    inputRef.current?.focus();
  };

  const handleSaveEdit = (messageId: string) => {
    if (!editInputText.trim()) return;
    socket?.emit('editMessage', { messageId, text: editInputText });
    setEditingMessageId(null);
    setEditInputText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInputText('');
  };

  const startEditing = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditInputText(currentContent);
  };

  const handleSendReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    const replyText = replyInputTexts[parentId]?.trim();
    if (!socket || !replyText) return;

    if (activeTab === 'global') {
      socket.emit('sendGlobal', { text: replyText, parentId });
    } else if (activeTab === 'team') {
      socket.emit('sendTeam', { text: replyText, parentId });
    } else if (activeTab.startsWith('mp:')) {
      const target = activeTab.split(':')[1];
      socket.emit('sendGlobal', { text: `/${target} ${replyText}`, parentId });
    } else if (activeTab.startsWith('team:')) {
      const target = activeTab.split(':')[1];
      socket.emit('sendGlobal', { text: `/${target} ${replyText}`, parentId });
    }

    setReplyInputTexts(prev => ({
      ...prev,
      [parentId]: ''
    }));
  };

  // Handle auto-completion input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = value.substring(0, selectionStart);

    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    const lastSlashIdx = textBeforeCursor.lastIndexOf('/');

    let triggerIdx = -1;
    let type: 'mention' | 'command' | null = null;

    const isAtValid = lastAtIdx >= 0 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ');
    const isSlashValid = lastSlashIdx >= 0 && (lastSlashIdx === 0 || textBeforeCursor[lastSlashIdx - 1] === ' ');

    if (isAtValid && isSlashValid) {
      if (lastAtIdx > lastSlashIdx) {
        triggerIdx = lastAtIdx;
        type = 'mention';
      } else {
        triggerIdx = lastSlashIdx;
        type = 'command';
      }
    } else if (isAtValid) {
      triggerIdx = lastAtIdx;
      type = 'mention';
    } else if (isSlashValid) {
      triggerIdx = lastSlashIdx;
      type = 'command';
    }

    if (type !== null && triggerIdx >= 0) {
      const searchWord = textBeforeCursor.substring(triggerIdx + 1).toLowerCase();
      
      // Extract unique list of pseudos and team names
      const allPseudos = (players || []).map(p => p.pseudo).filter(Boolean);
      const allTeamNames = (teams || []).map(t => t.name).filter(Boolean);
      const targets = [...allPseudos, ...allTeamNames];

      const filtered = targets.filter(t => t.toLowerCase().startsWith(searchWord));

      setSuggestions(filtered);
      setSuggestionType(type);
      setSuggestionTriggerIndex(triggerIdx);
      setActiveSuggestionIdx(0);
    } else {
      setSuggestions([]);
      setSuggestionType(null);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    if (suggestionTriggerIndex < 0) return;

    const beforeTrigger = inputText.substring(0, suggestionTriggerIndex);
    const selectionStart = inputRef.current?.selectionStart || 0;
    const afterCursor = inputText.substring(selectionStart);

    const prefix = suggestionType === 'mention' ? '@' : '/';
    const newText = beforeTrigger + prefix + suggestion + ' ' + afterCursor;

    setInputText(newText);
    setSuggestions([]);
    setSuggestionType(null);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = beforeTrigger.length + suggestion.length + 2; // Prefix + suggestion + space
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIdx(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestionIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        setSuggestionType(null);
      }
    }
  };

  // Filter messages based on active tab
  const getFilteredMessages = () => {
    const filtered = messages.filter(msg => {
      if (msg.parentId) return false;

      if (activeTab === 'system') {
        return msg.role === 'SYSTEM';
      }
      
      if (msg.role === 'SYSTEM') return false;

      if (activeTab.startsWith('mp:')) {
        const target = activeTab.split(':')[1].toLowerCase();
        // In MP tab, show only private messages involving the target
        if (msg.isPrivate) {
          const isFromTarget = msg.sender.toLowerCase() === target;
          const isToTarget = msg.targetPseudo?.toLowerCase() === target || msg.targetTeamName?.toLowerCase() === target;
          return isFromTarget || isToTarget;
        }
        return false;
      }

      if (activeTab.startsWith('team:')) {
        const target = activeTab.split(':')[1].toLowerCase();
        // Dans le salon inter-équipe, on montre les messages privés d'équipe échangés avec cette équipe
        if (msg.isPrivate && msg.targetTeamName) {
          const isFromTarget = msg.teamName?.toLowerCase() === target && msg.targetTeamName.toLowerCase() === myTeamName.toLowerCase();
          const isToTarget = msg.teamName?.toLowerCase() === myTeamName.toLowerCase() && msg.targetTeamName.toLowerCase() === target;
          return isFromTarget || isToTarget;
        }
        return false;
      }

      // In other tabs, exclude private messages
      if (msg.isPrivate) return false;

      if (activeTab === 'team') {
        // Salon interne de l'équipe : montre uniquement les messages d'équipe non privés vers une autre équipe
        return msg.channel === 'team' && !msg.targetTeamName;
      }

      // Global tab shows public global messages
      return msg.channel === 'global';
    });

    if (activeTab === 'system') {
      return [...filtered].reverse();
    }
    return filtered;
  };

  const filteredMessages = getFilteredMessages();

  const getRoleBadgeColor = (msg: ChatMessage) => {
    if (msg.role === 'SYSTEM') return '#ff3b3b';
    if (msg.role === 'ADMIN') return '#a855f7';
    if (msg.isPrivate) return '#e0f2fe';
    return '#00ffcc';
  };

  const getRoleLabel = (msg: ChatMessage) => {
    if (msg.role === 'SYSTEM') return 'SYS';
    if (msg.role === 'ADMIN') return 'HQ';
    if (msg.targetPseudo) return 'MP';
    if (msg.targetTeamName) return `VERS ${msg.targetTeamName.toUpperCase()}`;
    return msg.teamName || 'AGENT';
  };

  const totalUnreadMp = Object.values(unreadMps).reduce((a, b) => a + b, 0);
  const totalUnreadTeamMps = Object.values(unreadTeams).reduce((a, b) => a + b, 0);
  const unreadCount = unreadGlobal + unreadTeam + totalUnreadMp + totalUnreadTeamMps + unreadSystem;

  // Calculer s'il y a des messages non lus en dehors du canal actif
  const hasUnreadInOtherTabs = 
    (activeTab !== 'global' && unreadGlobal > 0) ||
    (activeTab !== 'team' && unreadTeam > 0) ||
    (activeTab !== 'system' && unreadSystem > 0) ||
    (!activeTab.startsWith('mp:') && totalUnreadMp > 0) ||
    (activeTab.startsWith('mp:') && Object.entries(unreadMps).some(([pseudo, count]) => pseudo !== activeTab.substring(3).toLowerCase() && count > 0)) ||
    (!activeTab.startsWith('team:') && totalUnreadTeamMps > 0) ||
    (activeTab.startsWith('team:') && Object.entries(unreadTeams).some(([tName, count]) => tName !== activeTab.substring(5).toLowerCase() && count > 0));

  useEffect(() => {
    onUnreadChange?.({
      global: unreadGlobal,
      team: unreadTeam + totalUnreadTeamMps,
      system: unreadSystem,
      unreadMps,
      unreadTeams,
      total: unreadCount
    });
  }, [unreadGlobal, unreadTeam, totalUnreadTeamMps, unreadSystem, unreadMps, unreadTeams, unreadCount, onUnreadChange]);

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => changeIsOpen(true)}
          className="chat-toggle-btn"
          style={{
            position: 'fixed',
            bottom: '25px',
            right: '25px',
            zIndex: 9998,
            background: 'rgba(10, 15, 30, 0.8)',
            border: '1.5px solid rgba(0, 255, 204, 0.6)',
            borderRadius: '50px',
            padding: '12px 20px',
            color: '#00ffcc',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 15px rgba(0, 255, 204, 0.25)',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 204, 0.5)';
            e.currentTarget.style.borderColor = '#00ffcc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(0, 255, 204, 0.6)';
          }}
        >
          <MessageSquare size={16} className="chat-pulse-icon" />
          <span>Comm-Link</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: '#ff3b3b',
                color: '#fff',
                borderRadius: '9999px',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Main Container */}
      <div
        className={`chat-sidebar-container ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}
      >
        {/* Drag handle for mobile Bottom Sheet */}
        <div 
          className="chat-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <style>{`
          .chat-sidebar-container {
            position: absolute;
            top: 0;
            right: 0;
            height: 100%;
            width: 400px;
            max-width: 100%;
            z-index: 9999;
            background: rgba(5, 8, 16, 0.94);
            border-left: 1px solid rgba(0, 255, 204, 0.25);
            backdrop-filter: blur(16px);
            box-shadow: -10px 0 30px rgba(0, 0, 0, 0.7);
            display: none;
            flex-direction: column;
            color: #fff;
            font-family: ui-sans-serif, system-ui, sans-serif;
            overflow: hidden;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s ease;
          }
          .chat-sidebar-container.open {
            display: flex;
          }
          .chat-sidebar-container.expanded {
            width: 600px;
          }
          .chat-drag-handle {
            display: none;
          }
          
          /* Handle mobile bottom sheet view */
          @media (max-width: 768px) {
            .chat-sidebar-container {
              position: fixed;
              top: auto;
              bottom: 0;
              left: 0;
              right: 0;
              height: 75vh;
              width: 100% !important;
              border-left: none;
              border-top: 1px solid rgba(0, 255, 204, 0.3);
              border-radius: 20px 20px 0 0;
              box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
              transform: translateY(0);
            }
            .chat-drag-handle {
              display: block;
              width: 40px;
              height: 5px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 10px;
              margin: 8px auto 4px auto;
              flex-shrink: 0;
              cursor: grab;
            }
          }

          .chat-drawer-overlay {
            position: absolute;

            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 10;
            opacity: ${isDrawerOpen ? 1 : 0};
            pointer-events: ${isDrawerOpen ? 'auto' : 'none'};
            transition: opacity 0.3s ease;
          }

          .chat-drawer {
            position: absolute;
            top: 0;
            left: 0;
            width: 260px;
            max-width: 85%;
            height: 100%;
            background: rgba(10, 15, 30, 0.98);
            border-right: 1px solid rgba(0, 255, 204, 0.3);
            z-index: 11;
            transform: ${isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)'};
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            box-shadow: 5px 0 20px rgba(0,0,0,0.5);
          }

          .channel-item {
            padding: 12px 16px;
            cursor: pointer;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            transition: all 0.2s;
            color: rgba(255,255,255,0.7);
            border-radius: 6px;
            margin: 2px 8px;
          }
          .channel-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
          }
          .channel-item.active {
            background: rgba(0, 255, 204, 0.15);
            color: #00ffcc;
            font-weight: bold;
          }
          .channel-badge {
            background: #ff3b3b;
            color: #fff;
            border-radius: 9999px;
            min-width: 16px;
            height: 16px;
            padding: 0 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: bold;
          }
          .chat-message-item {
            transition: background-color 0.15s ease;
          }
          .chat-message-item:hover {
            background-color: rgba(255, 255, 255, 0.02) !important;
          }
          .drawer-toggle-btn {
            background: transparent;
            border: none;
            color: #00ffcc;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            border-radius: 6px;
            transition: background-color 0.2s;
          }
          .drawer-toggle-btn:hover {
            background: rgba(0, 255, 204, 0.15);
          }
        `}</style>

        {/* --- DRAWER OVERLAY & MENU --- */}
        <div className="chat-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
        
        <div className="chat-drawer">
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0, 255, 204, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} style={{ color: '#00ffcc' }} />
              <h2 style={{ fontSize: '0.9rem', margin: 0, color: '#00ffcc', fontWeight: 'bold', letterSpacing: '1px' }}>
                NEXUS
              </h2>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#ff3b3b', cursor: 'pointer', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {/* Groupe 1 : CANAUX */}
            <div 
              onClick={() => setIsGroup1Expanded(!isGroup1Expanded)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.7rem', 
                color: 'rgba(255,255,255,0.4)', 
                padding: '0 16px', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                letterSpacing: '1px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {isGroup1Expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              CANAUX
            </div>
            {isGroup1Expanded && (
              <>
                <div className={`channel-item ${activeTab === 'global' ? 'active' : ''}`} onClick={() => { changeActiveTab('global'); setIsDrawerOpen(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Radio size={14} /> # global</div>
                  {unreadGlobal > 0 && <span className="channel-badge">{unreadGlobal}</span>}
                </div>
                <div className={`channel-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => { changeActiveTab('system'); setIsDrawerOpen(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={14} /> # système</div>
                  {unreadSystem > 0 && <span className="channel-badge">{unreadSystem}</span>}
                </div>
              </>
            )}

            {/* Groupe 2 : JOUEURS */}
            <div 
              onClick={() => setIsGroup2Expanded(!isGroup2Expanded)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.7rem', 
                color: 'rgba(255,255,255,0.4)', 
                padding: '0 16px', 
                marginTop: '20px', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                letterSpacing: '1px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {isGroup2Expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              JOUEURS EN LIGNE
            </div>
            {isGroup2Expanded && (
              <>
                {(players || []).filter(p => p.pseudo.toLowerCase() !== myPseudo.toLowerCase() && onlineUsers.has(p.pseudo.toLowerCase())).map(p => {
                  const pseudo = p.pseudo.toLowerCase();
                  const isActive = activeTab === `mp:${pseudo}`;
                  const unreadCountForUser = unreadMps[pseudo] || 0;
                  const hasUnread = unreadCountForUser > 0;

                  return (
                    <div key={pseudo} className={`channel-item ${isActive ? 'active' : ''}`} onClick={() => { changeActiveTab(`mp:${pseudo}`); setIsDrawerOpen(false); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ffcc', boxShadow: '0 0 5px #00ffcc' }} />
                        {p.pseudo}
                      </div>
                      {hasUnread && <span className="channel-badge" style={{ background: '#a855f7' }}>{unreadCountForUser}</span>}
                    </div>
                  );
                })}
              </>
            )}

            {/* Groupe 3 : ÉQUIPES */}
            <div 
              onClick={() => setIsGroup3Expanded(!isGroup3Expanded)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.7rem', 
                color: 'rgba(255,255,255,0.4)', 
                padding: '0 16px', 
                marginTop: '20px', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                letterSpacing: '1px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {isGroup3Expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              ÉQUIPES
            </div>
            {isGroup3Expanded && (
              <>
                {/* Notre propre équipe */}
                {myTeamName && myTeamName.toLowerCase() !== 'sans équipe' && (
                  <div className={`channel-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => { changeActiveTab('team'); setIsDrawerOpen(false); }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={14} style={{ color: myTeamColor }} />
                      # équipe ({myTeamName})
                    </div>
                    {unreadTeam > 0 && <span className="channel-badge" style={{ background: myTeamColor, color: '#000' }}>{unreadTeam}</span>}
                  </div>
                )}

                {/* Les autres équipes */}
                {(teams || []).filter(t => t.name && t.name.toLowerCase() !== 'sans équipe' && t.name.toLowerCase() !== myTeamName.toLowerCase()).map(t => {
                  const teamKey = t.name.toLowerCase();
                  const isActive = activeTab === `team:${teamKey}`;
                  const unreadCountForTeam = unreadTeams[teamKey] || 0;
                  const hasUnread = unreadCountForTeam > 0;
                  const teamColor = t.color || '#00b3ff';

                  return (
                    <div key={teamKey} className={`channel-item ${isActive ? 'active' : ''}`} onClick={() => { changeActiveTab(`team:${teamKey}`); setIsDrawerOpen(false); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={14} style={{ color: teamColor }} />
                        {t.name}
                      </div>
                      {hasUnread && <span className="channel-badge" style={{ background: teamColor, color: '#000' }}>{unreadCountForTeam}</span>}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* --- MAIN CHAT PANEL (Single Column) --- */}
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(0, 255, 204, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 255, 204, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="drawer-toggle-btn" 
              onClick={() => setIsDrawerOpen(true)} 
              title="Menu Navigation"
              style={{ position: 'relative' }}
            >
              <Menu size={22} />
              {hasUnreadInOtherTabs && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ff3b3b',
                  borderRadius: '50%',
                  padding: '2.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(5, 8, 16, 0.94)',
                  boxShadow: '0 0 5px #ff3b3b',
                  zIndex: 10
                }}>
                  <Mail size={8} color="#fff" />
                </div>
              )}
            </button>
            <h3 style={{ 
              margin: 0, 
              fontSize: '0.95rem', 
              color: activeTab.startsWith('mp:') ? '#a855f7' : (
                activeTab === 'team' ? myTeamColor : (
                  activeTab.startsWith('team:') ? (teams.find(t => t.name?.toLowerCase() === activeTab.split(':')[1])?.color || '#00b3ff') : (
                    activeTab === 'system' ? '#ff3b3b' : '#00ffcc'
                  )
                )
              ), 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              {activeTab === 'global' && <><Radio size={16}/> # global</>}
              {activeTab === 'team' && <><Shield size={16}/> # équipe ({myTeamName || 'Sans équipe'})</>}
              {activeTab === 'system' && <><Info size={16}/> # système</>}
              {activeTab.startsWith('mp:') && <><MessageSquare size={16}/> @{activeTab.split(':')[1]}</>}
              {activeTab.startsWith('team:') && <><Shield size={16}/> @équipe {activeTab.split(':')[1]}</>}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
              title={isExpanded ? "Réduire" : "Agrandir"}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() => changeIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.15)' }}>
          {filteredMessages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.8rem', padding: '20px' }}>
              <Terminal size={32} style={{ margin: '0 auto 10px', opacity: 0.15 }} />
              Début de l'historique des messages.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMentioned = msg.content.toLowerCase().includes(`@${myPseudo.toLowerCase()}`) || 
                                  (myTeamName && msg.content.toLowerCase().includes(`@${myTeamName.toLowerCase()}`));
              const isWhisperToMe = msg.targetPseudo === myPseudo;
              const isWhisperFromMe = msg.sender === myPseudo && msg.targetPseudo;
              
              let borderLeftColor = 'transparent';
              let itemBg = 'transparent';
              
              if (msg.role === 'SYSTEM') {
                itemBg = 'rgba(255, 59, 59, 0.03)';
                borderLeftColor = 'rgba(255, 59, 59, 0.4)';
              } else if (msg.isPrivate) {
                itemBg = 'rgba(168, 85, 247, 0.04)';
                borderLeftColor = 'rgba(168, 85, 247, 0.5)';
              } else if (isMentioned) {
                itemBg = 'rgba(255, 215, 0, 0.03)';
                borderLeftColor = 'rgba(255, 215, 0, 0.5)';
              }

              const msgReplies = messages.filter(m => m.parentId === msg.id);
              const hasReplies = msgReplies.length > 0;
              const isThreadExpanded = !!expandedThreads[msg.id];
              const avatarUrl = getAvatarUrl(msg);

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Root Message Box */}
                  <div 
                    className="chat-message-item"
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => {
                      setHoveredMessageId(null);
                      setActiveEmojiPickerId(null);
                    }}
                    style={{ 
                      background: itemBg,
                      borderLeft: `2.5px solid ${borderLeftColor}`,
                      padding: '6px 12px',
                      fontSize: '0.85rem',
                      lineHeight: '1.4',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      position: 'relative'
                    }}
                  >
                    {/* Left Column: Avatar */}
                    <div style={{ flexShrink: 0, position: 'relative' }}>
                      {msg.role === 'SYSTEM' ? (
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255, 59, 59, 0.1)',
                            border: '1.5px solid rgba(255, 59, 59, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ff3b3b'
                          }}
                        >
                          <Terminal size={16} />
                        </div>
                      ) : (
                        <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                          <img
                            src={avatarUrl || ''}
                            alt={msg.sender}
                            onError={(e) => {
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                e.currentTarget.remove();
                                const fallback = document.createElement('div');
                                fallback.style.width = '32px';
                                fallback.style.height = '32px';
                                fallback.style.borderRadius = '50%';
                                fallback.style.background = 'rgba(255,255,255,0.05)';
                                fallback.style.border = '1px solid rgba(255,255,255,0.15)';
                                fallback.style.display = 'flex';
                                fallback.style.alignItems = 'center';
                                fallback.style.justifyContent = 'center';
                                fallback.style.color = getRoleBadgeColor(msg);
                                fallback.style.fontWeight = 'bold';
                                fallback.style.fontSize = '0.75rem';
                                fallback.innerText = msg.sender.substring(0, 2).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: `1px solid ${getRoleBadgeColor(msg)}44`,
                              background: 'rgba(0,0,0,0.2)'
                            }}
                          />
                          {/* Green dot on avatar in chat */}
                          {onlineUsers.has(msg.sender.toLowerCase()) && (
                            <div style={{
                              position: 'absolute',
                              bottom: '0px',
                              right: '0px',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: '#00ffcc',
                              border: '2px solid rgba(5, 8, 16, 0.94)',
                              boxShadow: '0 0 4px #00ffcc',
                              zIndex: 10
                            }} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Content Column */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Header: Sender Name, Badges, Timestamp */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px', opacity: 0.85 }}>
                        <span style={{ fontWeight: 'bold', color: getRoleBadgeColor(msg), textShadow: `0 0 6px ${getRoleBadgeColor(msg)}22`, fontSize: '0.8rem' }}>
                          @{msg.sender}
                        </span>
                        
                        <span style={{ fontSize: '0.58rem', padding: '0px 3px', borderRadius: '2px', background: `${getRoleBadgeColor(msg)}15`, color: getRoleBadgeColor(msg), fontWeight: 'bold', border: `0.5px solid ${getRoleBadgeColor(msg)}22`, textTransform: 'uppercase' }}>
                          {getRoleLabel(msg)}
                        </span>
                        
                        {isWhisperToMe && (
                          <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (Pour vous)</span>
                        )}
                        {isWhisperFromMe && (
                          <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (À @{msg.targetPseudo})</span>
                        )}

                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.isEdited && <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', marginLeft: '4px', fontStyle: 'italic' }}>(modifié)</span>}
                        </span>
                      </div>

                      {/* Content text / Edit Editor */}
                      {editingMessageId === msg.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', maxWidth: '100%' }}>
                          <input
                            type="text"
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(msg.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.6)',
                              border: '1px solid #00ffcc',
                              borderRadius: '4px',
                              padding: '6px 8px',
                              color: '#fff',
                              fontSize: '0.8rem',
                              outline: 'none'
                            }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem' }}>
                            <button 
                              type="button" 
                              onClick={() => handleSaveEdit(msg.id)} 
                              style={{ background: '#00ffcc', color: '#000', border: 'none', borderRadius: '3px', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              Enregistrer
                            </button>
                            <button 
                              type="button" 
                              onClick={handleCancelEdit} 
                              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '3px', padding: '2px 8px', cursor: 'pointer' }}
                            >
                              Annuler
                            </button>
                            <span style={{ color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
                              (Entrée pour enregistrer, Échap pour annuler)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: msg.role === 'SYSTEM' ? '#ff8888' : '#e2e8f0', wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '1px' }}>
                          {msg.role === 'SYSTEM' ? decodeHtmlEntities(msg.content) : formatMentions(decodeHtmlEntities(msg.content))}
                        </div>
                      )}

                      {/* Emoji Reactions List */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {msg.reactions.map((reaction) => {
                            const hasMyReaction = reaction.users.includes(myPseudo);
                            return (
                              <button
                                key={reaction.emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (socket) {
                                    socket.emit('addReaction', { messageId: msg.id, emoji: reaction.emoji });
                                  }
                                }}
                                title={`Réactions de : ${reaction.users.join(', ')}`}
                                style={{
                                  background: hasMyReaction ? 'rgba(0, 255, 204, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                  border: `1.5px solid ${hasMyReaction ? '#00ffcc' : 'rgba(255, 255, 255, 0.1)'}`,
                                  borderRadius: '6px',
                                  padding: '2px 6px',
                                  color: hasMyReaction ? '#00ffcc' : 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <span>{reaction.emoji}</span>
                                <span style={{ fontWeight: 'bold' }}>{reaction.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline Thread Action Toggle Button */}
                      {hasReplies && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedThreads(prev => ({
                              ...prev,
                              [msg.id]: !prev[msg.id]
                            }));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#00ffcc',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '6px',
                            padding: '2px 0'
                          }}
                        >
                          <MessageSquare size={12} />
                          {isThreadExpanded 
                            ? `Masquer les réponses (${msgReplies.length})` 
                            : `Afficher les réponses (${msgReplies.length})`}
                        </button>
                      )}
                    </div>

                    {/* Floating Action Toolbar on Hover */}
                    {hoveredMessageId === msg.id && msg.role !== 'SYSTEM' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '8px',
                          zIndex: 100,
                          display: 'flex',
                          alignItems: 'center',
                          background: 'rgba(10, 15, 30, 0.95)',
                          border: '1px solid rgba(0, 255, 204, 0.4)',
                          borderRadius: '6px',
                          padding: '2px 4px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(4px)',
                          gap: '2px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEmojiPickerId(activeEmojiPickerId === msg.id ? null : msg.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#00ffcc',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background-color 0.15s'
                          }}
                          title="Ajouter une réaction"
                        >
                          😊+
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedThreads(prev => ({
                              ...prev,
                              [msg.id]: true
                            }));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#00ffcc',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background-color 0.15s'
                          }}
                          title="Répondre dans le fil"
                        >
                          <MessageSquare size={14} />
                        </button>

                        {(msg.sender === myPseudo || (user as any)?.role === 'ADMIN') && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(msg.id, msg.content);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#00ffcc',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'background-color 0.15s'
                              }}
                              title="Modifier le message"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Voulez-vous vraiment supprimer ce message ?")) {
                                  socket?.emit('deleteMessage', { messageId: msg.id });
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ff3b3b',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'background-color 0.15s'
                              }}
                              title="Supprimer le message"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {activeEmojiPickerId === msg.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-3px',
                              right: '100%',
                              marginRight: '6px',
                              background: 'rgba(10, 15, 30, 0.98)',
                              border: '1px solid rgba(0, 255, 204, 0.4)',
                              borderRadius: '6px',
                              padding: '4px 6px',
                              display: 'flex',
                              gap: '6px',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
                              zIndex: 110,
                            }}
                          >
                            {['👍', '❤️', '😂', '🔥', '🚀'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (socket) {
                                    socket.emit('addReaction', { messageId: msg.id, emoji });
                                  }
                                  setActiveEmojiPickerId(null);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '1.05rem',
                                  padding: '2px 4px',
                                  borderRadius: '4px',
                                  transition: 'transform 0.1s ease, background-color 0.1s'
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Collapsible Thread Replies Block */}
                  {isThreadExpanded && (
                    <div
                      style={{
                        marginLeft: '38px',
                        paddingLeft: '14px',
                        borderLeft: '2px solid rgba(0, 255, 204, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginTop: '2px',
                        marginBottom: '10px'
                      }}
                    >
                      {/* Replies List */}
                      {msgReplies.map((reply) => {
                        const isReplyMentioned = reply.content.toLowerCase().includes(`@${myPseudo.toLowerCase()}`) || 
                                                (myTeamName && reply.content.toLowerCase().includes(`@${myTeamName.toLowerCase()}`));
                        const replyAvatar = getAvatarUrl(reply);
                        const isReplyWhisperToMe = reply.targetPseudo === myPseudo;
                        const isReplyWhisperFromMe = reply.targetPseudo && reply.sender === myPseudo;

                        return (
                          <div
                            key={reply.id}
                            style={{
                              background: isReplyMentioned ? 'rgba(255, 215, 0, 0.03)' : 'transparent',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'flex-start',
                              position: 'relative'
                            }}
                          >
                            {/* Reply Avatar */}
                            <div style={{ flexShrink: 0, width: '24px', height: '24px' }}>
                              <img 
                                src={replyAvatar || ''} 
                                alt={reply.sender}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${getRoleBadgeColor(reply)}33` }}
                              />
                            </div>
                            
                            {/* Reply Content Column */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', opacity: 0.85 }}>
                                <span style={{ fontWeight: 'bold', color: getRoleBadgeColor(reply), fontSize: '0.75rem' }}>
                                  @{reply.sender}
                                </span>
                                <span style={{ fontSize: '0.55rem', padding: '0px 2px', borderRadius: '2px', background: `${getRoleBadgeColor(reply)}15`, color: getRoleBadgeColor(reply), fontWeight: 'bold', textTransform: 'uppercase' }}>
                                  {getRoleLabel(reply)}
                                </span>
                                {isReplyWhisperToMe && (
                                  <span style={{ fontSize: '0.6rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (Pour vous)</span>
                                )}
                                {isReplyWhisperFromMe && (
                                  <span style={{ fontSize: '0.6rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (À @{reply.targetPseudo})</span>
                                )}
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
                                  {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {reply.isEdited && <span style={{ fontSize: '0.5rem', marginLeft: '4px', fontStyle: 'italic' }}>(modifié)</span>}
                                </span>
                              </div>

                              {/* Reply Text Content or Edit Input */}
                              {editingMessageId === reply.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '3px' }}>
                                  <input
                                    type="text"
                                    value={editInputText}
                                    onChange={(e) => setEditInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(reply.id);
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    style={{
                                      width: '100%',
                                      background: 'rgba(0,0,0,0.6)',
                                      border: '1px solid #00ffcc',
                                      borderRadius: '4px',
                                      padding: '4px 6px',
                                      color: '#fff',
                                      fontSize: '0.75rem',
                                      outline: 'none'
                                    }}
                                    autoFocus
                                  />
                                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.6rem' }}>
                                    <button type="button" onClick={() => handleSaveEdit(reply.id)} style={{ background: '#00ffcc', color: '#000', border: 'none', borderRadius: '2px', padding: '1px 6px', cursor: 'pointer', fontWeight: 'bold' }}>Enregistrer</button>
                                    <button type="button" onClick={handleCancelEdit} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '2px', padding: '1px 6px', cursor: 'pointer' }}>Annuler</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ color: '#e2e8f0', wordBreak: 'break-word', whiteSpace: 'pre-wrap', marginTop: '1px' }}>
                                  {formatMentions(decodeHtmlEntities(reply.content))}
                                </div>
                              )}
                            </div>

                            {/* Reply Action Toolbar */}
                            <div style={{ display: 'flex', gap: '4px', opacity: 0.7, alignSelf: 'center' }}>
                              {(reply.sender === myPseudo || (user as any)?.role === 'ADMIN') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditing(reply.id, reply.content)}
                                    style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', padding: '2px' }}
                                    title="Modifier la réponse"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm("Voulez-vous vraiment supprimer cette réponse ?")) {
                                        socket?.emit('deleteMessage', { messageId: reply.id });
                                      }
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: '2px' }}
                                    title="Supprimer la réponse"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Reply Input Form */}
                      <form
                        onSubmit={(e) => handleSendReply(e, msg.id)}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '6px',
                          paddingRight: '12px'
                        }}
                      >
                        <input
                          type="text"
                          value={replyInputTexts[msg.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReplyInputTexts(prev => ({
                              ...prev,
                              [msg.id]: val
                            }));
                          }}
                          placeholder="Répondre à ce fil..."
                          style={{
                            flex: 1,
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(0, 255, 204, 0.2)',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            color: '#fff',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="submit"
                          style={{
                            background: 'rgba(0, 255, 204, 0.15)',
                            border: '1px solid #00ffcc',
                            borderRadius: '4px',
                            padding: '4px 10px',
                            color: '#00ffcc',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Répondre
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Dropdown Popup */}
        {suggestions.length > 0 && (
          <div
            style={{
              margin: '0 16px',
              padding: '6px 0',
              background: 'rgba(10, 15, 30, 0.96)',
              border: '1px solid rgba(0, 255, 204, 0.35)',
              borderRadius: '8px',
              boxShadow: '0 -5px 25px rgba(0, 255, 204, 0.15)',
              maxHeight: '160px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100000
            }}
          >
            <div style={{ fontSize: '0.65rem', color: '#a0aec0', padding: '4px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>CIBLES DISPONIBLES ({suggestionType === 'mention' ? '@Mentions' : '/Messages Privés'})</span>
              <span>↑↓ Naviguer | Entrée Valider</span>
            </div>
            {suggestions.map((item, idx) => {
              const isSelected = idx === activeSuggestionIdx;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: isSelected ? '#00ffcc' : 'transparent',
                    color: isSelected ? '#000' : '#e2e8f0',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background-color 0.15s, color 0.15s'
                  }}
                  onMouseEnter={() => setActiveSuggestionIdx(idx)}
                >
                  {suggestionType === 'mention' ? '@' : '/'}{item}
                </button>
              );
            })}
          </div>
        )}

        {/* Temporary Error Notice */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              borderTop: '1.5px solid #ef4444',
              color: '#fca5a5',
              padding: '10px 16px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={14} style={{ color: '#ef4444' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        {activeTab !== 'system' ? (
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(0, 255, 204, 0.15)',
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              gap: '10px'
            }}
          >
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={`Transmettre sur [${activeTab.toUpperCase()}]...`}
                maxLength={500}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${activeTab === 'team' ? myTeamColor + '44' : 'rgba(0, 255, 204, 0.25)'}`,
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = activeTab === 'team' ? myTeamColor : '#00ffcc';
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (document.activeElement !== inputRef.current) {
                      e.target.style.borderColor = activeTab === 'team' ? myTeamColor + '44' : 'rgba(0, 255, 204, 0.25)';
                    }
                  }, 200);
                }}
              />
              <span 
                className="input-cursor-blink" 
                style={{
                  position: 'absolute',
                  right: '12px',
                  color: activeTab === 'team' ? myTeamColor : '#00ffcc',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  opacity: inputText.length === 0 ? 0.7 : 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none'
                }}
              >
                _
              </span>
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                background: inputText.trim() 
                  ? (activeTab === 'team' ? myTeamColor : '#00ffcc') 
                  : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '6px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: inputText.trim() ? '#000' : 'rgba(255,255,255,0.2)',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              <Send size={15} />
            </button>
          </form>
        ) : (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(0, 255, 204, 0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.75rem',
              textAlign: 'center'
            }}
          >
            Le canal SYSTEM est en lecture seule.
          </div>
        )}
      </div>
    </>
  );
}
