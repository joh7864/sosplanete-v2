import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Shield, AlertTriangle, Send, X, Terminal, Radio, Info, Maximize2, Minimize2, Menu, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChatSocket } from '../hooks/useChatSocket';
import { ChatMessageItem } from './chat/ChatMessageItem';


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
  isStealthMode?: boolean;
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
  onTabChange,
  isStealthMode
}: ChatPanelProps) {
  const { childInfos, user } = useAuth();
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

  const [inputText, setInputText] = useState('');

  const {
    socket,
    messages,
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
  } = useChatSocket({
    isOpen,
    activeTab,
    teams,
    onOnlineUsersChange,
    isStealthMode
  });

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyInputTexts, setReplyInputTexts] = useState<Record<string, string>>({});
  
  // Collapse/Expand state for Discord-like channel sections
  const [isGroup1Expanded, setIsGroup1Expanded] = useState(true);
  const [isGroup2Expanded, setIsGroup2Expanded] = useState(true);
  const [isGroup3Expanded, setIsGroup3Expanded] = useState(true);

  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

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

  const myPseudo = childInfos?.pseudo || '';
  const myPseudoRef = useRef(myPseudo);
  useEffect(() => {
    myPseudoRef.current = myPseudo;
  }, [myPseudo]);
  const currentPlayer = (players || []).find(p => p.id === childInfos?.id || p.childId === childInfos?.id);
  const myTeamId = currentPlayer?.teamId || currentPlayer?.team?.id;
  const myTeam = (teams || []).find((t: any) => t.id === myTeamId);
  const myTeamName = myTeam?.name || '';
  const myTeamNameRef = useRef(myTeamName);
  useEffect(() => {
    myTeamNameRef.current = myTeamName;
  }, [myTeamName]);
  const myTeamColor = myTeam?.color || '#00b3ff';


  useEffect(() => {
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
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


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
          id="btn-com-link"
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
        id="chat-panel-container"
        className={`chat-sidebar-container ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}
      >
        {/* Drag handle for mobile Bottom Sheet */}
        <div 
          className="chat-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {/* --- DRAWER OVERLAY & MENU --- */}
        <div className={`chat-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        
        <div className={`chat-drawer ${isDrawerOpen ? 'open' : ''}`}>

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
              const msgReplies = messages.filter(m => m.parentId === msg.id);
              return (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  msgReplies={msgReplies}
                  onlineUsers={onlineUsers || new Set()}
                  myPseudo={myPseudo}
                  myTeamName={myTeamName}
                  userRole={(user as any)?.role}
                  players={players || []}
                  hoveredMessageId={hoveredMessageId}
                  setHoveredMessageId={setHoveredMessageId}
                  activeEmojiPickerId={activeEmojiPickerId}
                  setActiveEmojiPickerId={setActiveEmojiPickerId}
                  editingMessageId={editingMessageId}
                  setEditingMessageId={setEditingMessageId}
                  editInputText={editInputText}
                  setEditInputText={setEditInputText}
                  expandedThreads={expandedThreads}
                  setExpandedThreads={setExpandedThreads}
                  replyInputTexts={replyInputTexts}
                  setReplyInputTexts={setReplyInputTexts}
                  onSendReply={(parentId, text) => {
                    if (activeTab === 'global') {
                      socket?.emit('sendGlobal', { text, parentId });
                    } else if (activeTab === 'team') {
                      socket?.emit('sendTeam', { text, parentId });
                    } else if (activeTab.startsWith('mp:')) {
                      const target = activeTab.substring(3);
                      socket?.emit('sendGlobal', { text: `/${target} ${text}`, parentId });
                    } else if (activeTab.startsWith('team:')) {
                      const target = activeTab.substring(5);
                      socket?.emit('sendGlobal', { text: `/${target} ${text}`, parentId });
                    }
                  }}
                  onAddReaction={(messageId, emoji) => {
                    socket?.emit('addReaction', { messageId, emoji });
                  }}
                  onEditMessage={(messageId, text) => {
                    socket?.emit('editMessage', { messageId, text });
                  }}
                  onDeleteMessage={(messageId) => {
                    socket?.emit('deleteMessage', { messageId });
                  }}
                />
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
