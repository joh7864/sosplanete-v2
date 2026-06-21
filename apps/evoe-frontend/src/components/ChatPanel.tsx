import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Shield, AlertTriangle, Send, X, Terminal, Radio, Info, Maximize2, Minimize2 } from 'lucide-react';
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
}

interface ChatPanelProps {
  players?: any[];
  teams?: any[];
}

export default function ChatPanel({ players = [], teams = [] }: ChatPanelProps) {
  const { childInfos } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'team' | 'mp' | 'system'>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadGlobal, setUnreadGlobal] = useState(0);
  const [unreadTeam, setUnreadTeam] = useState(0);
  const [unreadMp, setUnreadMp] = useState(0);
  const [unreadSystem, setUnreadSystem] = useState(0);

  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const isOpenRef = useRef(isOpen);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);


  // Suggestions state for auto-completion
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionType, setSuggestionType] = useState<'mention' | 'command' | null>(null);
  const [suggestionTriggerIndex, setSuggestionTriggerIndex] = useState(-1);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const savedAuth = localStorage.getItem('evoe_auth') || sessionStorage.getItem('evoe_auth');
  const myPseudo = childInfos?.pseudo || '';
  const myTeamName = childInfos?.group?.team?.name || '';
  const myTeamColor = childInfos?.group?.team?.color || '#00b3ff';

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
      transports: ['websocket']
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
      
      if (!isOpenRef.current || activeTabRef.current !== 'mp') {
        setUnreadMp(u => u + 1);
      }
    });

    socketInstance.on('msgPrivateTeam', (msg: ChatMessage) => {
      setMessages(prev => [...prev, { ...msg, isPrivate: true }]);
      
      if (!isOpenRef.current || activeTabRef.current !== 'mp') {
        setUnreadMp(u => u + 1);
      }
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
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      socketInstance.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [savedAuth]);

  // Clear unreads when tab changes or chat opens
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'global') setUnreadGlobal(0);
      if (activeTab === 'team') setUnreadTeam(0);
      if (activeTab === 'mp') setUnreadMp(0);
      if (activeTab === 'system') setUnreadSystem(0);
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

    if (activeTab === 'global') {
      socket.emit('sendGlobal', { text: inputText });
    } else if (activeTab === 'team') {
      socket.emit('sendTeam', { text: inputText });
    } else if (activeTab === 'mp') {
      if (!inputText.trim().startsWith('/')) {
        setErrorMsg("Format MP requis : /<nom_joueur_ou_équipe> <message>");
        setTimeout(() => setErrorMsg(null), 5000);
        return;
      }
      socket.emit('sendGlobal', { text: inputText });
    } else {
      setErrorMsg("Impossible d'émettre sur le canal système.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setInputText('');
    setSuggestions([]);
    setSuggestionType(null);
    inputRef.current?.focus();
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
      if (activeTab === 'system') {
        return msg.role === 'SYSTEM';
      }
      
      if (msg.role === 'SYSTEM') return false;

      // In MP tab, show only private messages
      if (activeTab === 'mp') {
        return msg.isPrivate === true;
      }

      // In other tabs, exclude private messages
      if (msg.isPrivate) return false;

      if (activeTab === 'team') {
        // Also show regular team messages
        return msg.channel === 'team';
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

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-toggle-btn"
          style={{
            position: 'fixed',
            bottom: '25px',
            right: '25px',
            zIndex: 999,
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
          {(unreadGlobal + unreadTeam + unreadMp + unreadSystem) > 0 && (
            <span
              style={{
                background: '#ff3b3b',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.7rem',
                minWidth: '16px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              {unreadGlobal + unreadTeam + unreadMp + unreadSystem}
            </span>
          )}
        </button>
      )}

      {/* Main Sidebar Chat Panel */}
      <div
        className={`chat-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: isExpanded ? '550px' : '360px',
          maxWidth: '90vw',
          zIndex: 9999,
          background: 'rgba(5, 8, 16, 0.94)',
          borderLeft: '1px solid rgba(0, 255, 204, 0.25)',
          backdropFilter: 'blur(16px)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          fontFamily: '"Courier New", Courier, monospace',
          pointerEvents: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(0, 255, 204, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 255, 204, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} style={{ color: '#00ffcc' }} />
            <h2
              style={{
                fontSize: '0.95rem',
                margin: 0,
                color: '#00ffcc',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Nexus Comm-Link
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isExpanded ? "Réduire la largeur" : "Agrandir la largeur"}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00ffcc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ff3b3b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(0, 255, 204, 0.15)',
            padding: '4px'
          }}
        >
          <button
            onClick={() => setActiveTab('global')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'global' ? 'rgba(0, 255, 204, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'global' ? '2px solid #00ffcc' : '2px solid transparent',
              color: activeTab === 'global' ? '#00ffcc' : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: 'inherit'
            }}
          >
            <Radio size={12} />
            <span>GLOBAL</span>
            {unreadGlobal > 0 && (
              <span style={{ background: '#ff3b3b', color: '#fff', borderRadius: '50%', padding: '1px 5px', fontSize: '0.65rem' }}>
                {unreadGlobal}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('team')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'team' ? 'rgba(0, 179, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'team' ? `2px solid ${myTeamColor}` : '2px solid transparent',
              color: activeTab === 'team' ? myTeamColor : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: 'inherit'
            }}
          >
            <Shield size={12} />
            <span>ÉQUIPE</span>
            {unreadTeam > 0 && (
              <span style={{ background: myTeamColor, color: '#000', borderRadius: '50%', padding: '1px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                {unreadTeam}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('mp')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'mp' ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'mp' ? '2px solid #a855f7' : '2px solid transparent',
              color: activeTab === 'mp' ? '#a855f7' : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: 'inherit'
            }}
          >
            <MessageSquare size={12} />
            <span>MP</span>
            {unreadMp > 0 && (
              <span style={{ background: '#a855f7', color: '#fff', borderRadius: '50%', padding: '1px 5px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                {unreadMp}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('system')}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === 'system' ? 'rgba(255, 59, 59, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'system' ? '2px solid #ff3b3b' : '2px solid transparent',
              color: activeTab === 'system' ? '#ff3b3b' : 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: 'inherit'
            }}
          >
            <Info size={12} />
            <span>SYSTEM</span>
            {unreadSystem > 0 && (
              <span style={{ background: '#ff3b3b', color: '#fff', borderRadius: '50%', padding: '1px 5px', fontSize: '0.65rem' }}>
                {unreadSystem}
              </span>
            )}
          </button>
        </div>

        {/* Message History Area */}
        <style>{`
          .chat-message-item {
            transition: background-color 0.15s ease;
          }
          .chat-message-item:hover {
            background-color: rgba(255, 255, 255, 0.02) !important;
          }
        `}</style>
        <div
          style={{
            flex: 1,
            padding: '12px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(0,0,0,0.15)'
          }}
        >
          {filteredMessages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.8rem', padding: '20px' }}>
              <Terminal size={32} style={{ margin: '0 auto 10px', opacity: 0.15 }} />
              {activeTab === 'system' 
                ? 'Aucune alerte système enregistrée.'
                : activeTab === 'team'
                ? `Canal sécurisé [${myTeamName || 'EQUIPE'}]. Aucun message.`
                : activeTab === 'mp'
                ? 'Aucun message privé. Utilisez /<joueur_ou_équipe> <message>.'
                : 'Canal global vide. Lancez la discussion !'}
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
                itemBg = 'rgba(168, 85, 247, 0.04)'; // Subtle purple overlay for whispers
                borderLeftColor = 'rgba(168, 85, 247, 0.5)';
              } else if (isMentioned) {
                itemBg = 'rgba(255, 215, 0, 0.03)'; // Subtle gold overlay for mentions
                borderLeftColor = 'rgba(255, 215, 0, 0.5)';
              }

              const avatarUrl = getAvatarUrl(msg);

              return (
                <div 
                  key={msg.id} 
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
                    fontSize: '0.8rem',
                    lineHeight: '1.4',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  {/* Left Avatar Container */}
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {msg.role === 'SYSTEM' ? (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        background: 'rgba(255, 59, 59, 0.1)',
                        border: '1px solid rgba(255, 59, 59, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff3b3b'
                      }}>
                        <Terminal size={16} />
                      </div>
                    ) : msg.role === 'ADMIN' ? (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '4px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a855f7'
                      }}>
                        <Shield size={16} />
                      </div>
                    ) : (
                      <img 
                        src={avatarUrl || ''} 
                        alt={msg.sender}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.style.width = '32px';
                            fallback.style.height = '32px';
                            fallback.style.borderRadius = '4px';
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
                          borderRadius: '4px',
                          objectFit: 'cover',
                          border: `1px solid ${getRoleBadgeColor(msg)}44`,
                          background: 'rgba(0,0,0,0.2)'
                        }}
                      />
                    )}
                  </div>

                  {/* Right Content Column */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header: Sender Name, Badges, Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px', opacity: 0.85 }}>
                      <span 
                        style={{ 
                          fontWeight: 'bold', 
                          color: getRoleBadgeColor(msg),
                          textShadow: `0 0 6px ${getRoleBadgeColor(msg)}22`,
                          fontSize: '0.8rem'
                        }}
                      >
                        @{msg.sender}
                      </span>
                      
                      <span 
                        style={{ 
                          fontSize: '0.58rem', 
                          padding: '0px 3px', 
                          borderRadius: '2px',
                          background: `${getRoleBadgeColor(msg)}15`,
                          color: getRoleBadgeColor(msg),
                          fontWeight: 'bold',
                          border: `0.5px solid ${getRoleBadgeColor(msg)}22`,
                          textTransform: 'uppercase'
                        }}
                      >
                        {getRoleLabel(msg)}
                      </span>
                      
                      {/* Whisper targeting details */}
                      {isWhisperToMe && (
                        <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (Pour vous)</span>
                      )}
                      {isWhisperFromMe && (
                        <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (À @{msg.targetPseudo})</span>
                      )}

                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content text */}
                    <div 
                      style={{ 
                        color: msg.role === 'SYSTEM' ? '#ff8888' : '#e2e8f0', 
                        wordBreak: 'break-word', 
                        whiteSpace: 'pre-wrap', 
                        fontSize: '0.8rem',
                        marginTop: '1px'
                      }}
                    >
                      {msg.role === 'SYSTEM' ? msg.content : formatMentions(msg.content)}
                    </div>

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
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
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
                  </div>

                  {/* Floating Action Toolbar on Hover */}
                  {hoveredMessageId === msg.id && msg.role !== 'SYSTEM' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '16px',
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

                      {/* Emoji Selector Dropdown Overlay */}
                      {activeEmojiPickerId === msg.id && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '26px',
                            right: 0,
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
                    // Timeout to let click on suggestions complete before closing dropdown
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
