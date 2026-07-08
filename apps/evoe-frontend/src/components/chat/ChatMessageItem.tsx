import React from 'react';
import type { ChatMessage } from '../../types/evoe';
import { Terminal, MessageSquare, Edit2, Trash2, Send } from 'lucide-react';

const EVOE_IMG_URL = import.meta.env.VITE_IMG_ROOT_URL || 'http://localhost:3011/static/';

interface ChatMessageItemProps {
  msg: ChatMessage;
  msgReplies: ChatMessage[];
  onlineUsers: Set<string>;
  myPseudo: string;
  myTeamName: string;
  userRole?: string;
  players: any[];
  
  // Hover & Emoji Pickers
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  activeEmojiPickerId: string | null;
  setActiveEmojiPickerId: (id: string | null) => void;
  
  // Editing
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editInputText: string;
  setEditInputText: (text: string) => void;
  
  // Threads
  expandedThreads: Record<string, boolean>;
  setExpandedThreads: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  replyInputTexts: Record<string, string>;
  setReplyInputTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  
  // Callbacks
  onSendReply: (parentId: string, text: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, text: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function ChatMessageItem({
  msg,
  msgReplies,
  onlineUsers,
  myPseudo,
  myTeamName,
  userRole,
  players,
  
  hoveredMessageId,
  setHoveredMessageId,
  activeEmojiPickerId,
  setActiveEmojiPickerId,
  
  editingMessageId,
  setEditingMessageId,
  editInputText,
  setEditInputText,
  
  expandedThreads,
  setExpandedThreads,
  replyInputTexts,
  setReplyInputTexts,
  
  onSendReply,
  onAddReaction,
  onEditMessage,
  onDeleteMessage
}: ChatMessageItemProps) {

  const getRoleBadgeColor = (m: ChatMessage) => {
    if (m.role === 'ADMIN') return '#ef4444'; // rouge
    if (m.role === 'SYSTEM') return '#ff8888'; // rouge clair / rose
    if (m.teamName) {
      const player = (players || []).find(p => p.pseudo.toLowerCase() === m.sender.toLowerCase());
      return player?.color || '#00b3ff';
    }
    return '#00ffcc';
  };

  const getRoleLabel = (m: ChatMessage) => {
    if (m.role === 'ADMIN') return 'QG ADMIN';
    if (m.role === 'SYSTEM') return 'NEXUS SYSTEM';
    if (m.teamName) return m.teamName.toUpperCase();
    return 'AGENT TEMPOREL';
  };

  const getAvatarUrl = (m: ChatMessage) => {
    if (m.role === 'SYSTEM' || m.role === 'ADMIN') {
      return null;
    }

    const player = (players || []).find(p => p.pseudo.toLowerCase() === m.sender.toLowerCase());
    const avatarValue = player?.avatar || null;
    const genderValue = player?.gender || null;

    if (avatarValue && avatarValue !== 'avatars/default.png') {
      return `${EVOE_IMG_URL}${avatarValue}`;
    }

    const hash = m.sender.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let file = '';
    const gender = genderValue || 'H';
    if (gender === 'EF') file = `EF_avatar_0${(hash % 3) + 1}.png`;
    else if (gender === 'EH') file = `EH_avatar_0${(hash % 3) + 1}.png`;
    else if (gender === 'F') file = `F_avatar_${((hash % 12) + 1).toString().padStart(2, '0')}.png`;
    else file = `H_avatar_0${(hash % 21) + 1}.png`;
    
    return `${EVOE_IMG_URL}avatars_3D/${file}`;
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
        const teamExists = (players || []).some(p => p.teamName?.toLowerCase() === mentionName);

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

  const isThreadExpanded = !!expandedThreads[msg.id];
  const hasReplies = msgReplies.length > 0;
  const avatarUrl = getAvatarUrl(msg);

  // Vérifier si mentionné dans le message racine
  const isMentioned = msg.content.toLowerCase().includes(`@${myPseudo.toLowerCase()}`) || 
                      (myTeamName && msg.content.toLowerCase().includes(`@${myTeamName.toLowerCase()}`));

  const isWhisperToMe = msg.isPrivate && msg.targetPseudo?.toLowerCase() === myPseudo.toLowerCase();
  const isWhisperFromMe = msg.isPrivate && msg.sender?.toLowerCase() === myPseudo.toLowerCase() && msg.targetPseudo;

  let itemBg = 'transparent';
  if (isMentioned) {
    itemBg = 'rgba(255, 215, 0, 0.04)';
  } else if (msg.isPrivate) {
    itemBg = 'rgba(168, 85, 247, 0.05)';
  }

  let borderLeftColor = 'transparent';
  if (msg.role === 'SYSTEM') borderLeftColor = '#ff8888';
  else if (msg.isPrivate) borderLeftColor = '#a855f7';
  else if (isMentioned) borderLeftColor = '#ffd700';

  const startEditing = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditInputText(text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditInputText('');
  };

  const handleSaveEdit = (id: string) => {
    if (editInputText.trim() !== '') {
      onEditMessage(id, editInputText);
      setEditingMessageId(null);
      setEditInputText('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Message Racine */}
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
        {/* Colonne Gauche: Avatar */}
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

        {/* Colonne Droite: Contenu */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
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

          {/* Corps de texte */}
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
              </div>
            </div>
          ) : (
            <div style={{ color: msg.role === 'SYSTEM' ? '#ff8888' : '#e2e8f0', wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '1px' }}>
              {msg.role === 'SYSTEM' ? decodeHtmlEntities(msg.content) : formatMentions(decodeHtmlEntities(msg.content))}
            </div>
          )}

          {/* Réactions */}
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
                      onAddReaction(msg.id, reaction.emoji);
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
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{reaction.emoji}</span>
                    <span style={{ fontWeight: 'bold', marginLeft: '3px' }}>{reaction.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bouton de réponses fil de discussion */}
          {hasReplies && (
            <button
              type="button"
              onClick={() => {
                setExpandedThreads(prev => ({ ...prev, [msg.id]: !prev[msg.id] }));
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

        {/* Toolbar Flottante d'Actions */}
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
              style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}
              title="Ajouter une réaction"
            >
              😊+
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedThreads(prev => ({ ...prev, [msg.id]: true }));
              }}
              style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', padding: '2px 6px' }}
              title="Répondre dans le fil"
            >
              <MessageSquare size={14} />
            </button>

            {(msg.sender === myPseudo || userRole === 'ADMIN') && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(msg.id, msg.content);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', padding: '2px 6px' }}
                  title="Modifier le message"
                >
                  <Edit2 size={14} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Voulez-vous vraiment supprimer ce message ?")) {
                      onDeleteMessage(msg.id);
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#ff3b3b', cursor: 'pointer', padding: '2px 6px' }}
                  title="Supprimer le message"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}

            {/* Emoji Picker Popover */}
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
                      onAddReaction(msg.id, emoji);
                      setActiveEmojiPickerId(null);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.05rem', padding: '2px 4px' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bloc des réponses du fil (Replies) */}
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
          {msgReplies.map((reply) => {
            const isReplyMentioned = reply.content.toLowerCase().includes(`@${myPseudo.toLowerCase()}`) || 
                                    (myTeamName && reply.content.toLowerCase().includes(`@${myTeamName.toLowerCase()}`));
            const replyAvatar = getAvatarUrl(reply);
            const isReplyWhisperToMe = reply.targetPseudo?.toLowerCase() === myPseudo.toLowerCase();
            const isReplyWhisperFromMe = reply.targetPseudo && reply.sender?.toLowerCase() === myPseudo.toLowerCase();

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
                <div style={{ flexShrink: 0, width: '24px', height: '24px' }}>
                  <img 
                    src={replyAvatar || ''} 
                    alt={reply.sender}
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${getRoleBadgeColor(reply)}33` }}
                  />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', opacity: 0.85 }}>
                    <span style={{ fontWeight: 'bold', color: getRoleBadgeColor(reply), fontSize: '0.75rem' }}>
                      @{reply.sender}
                    </span>
                    <span style={{ fontSize: '0.55rem', padding: '0px 2px', borderRadius: '2px', background: `${getRoleBadgeColor(reply)}15`, color: getRoleBadgeColor(reply), fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {getRoleLabel(reply)}
                    </span>
                    {isReplyWhisperToMe && <span style={{ fontSize: '0.6rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (Pour vous)</span>}
                    {isReplyWhisperFromMe && <span style={{ fontSize: '0.6rem', color: '#a855f7', fontWeight: 'bold' }}>➔ (À @{reply.targetPseudo})</span>}
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {reply.isEdited && <span style={{ fontSize: '0.5rem', marginLeft: '4px', fontStyle: 'italic' }}>(modifié)</span>}
                    </span>
                  </div>

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
                        <button type="button" onClick={() => handleSaveEdit(reply.id)} style={{ background: '#00ffcc', color: '#000', border: 'none', borderRadius: '2px', padding: '1px 6px', cursor: 'pointer' }}>Sauver</button>
                        <button type="button" onClick={handleCancelEdit} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '2px', padding: '1px 6px', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#cbd5e1', wordBreak: 'break-word', whiteSpace: 'pre-wrap', marginTop: '1px' }}>
                      {formatMentions(decodeHtmlEntities(reply.content))}
                    </div>
                  )}
                </div>

                {/* Bouton de suppression de réponse pour l'auteur ou l'admin */}
                {(reply.sender === myPseudo || userRole === 'ADMIN') && editingMessageId !== reply.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Voulez-vous vraiment supprimer cette réponse ?")) {
                        onDeleteMessage(reply.id);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 59, 59, 0.4)',
                      cursor: 'pointer',
                      padding: '2px',
                      position: 'absolute',
                      top: '6px',
                      right: '6px'
                    }}
                    title="Supprimer la réponse"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Formulaire de Réponse */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const replyText = replyInputTexts[msg.id] || '';
              if (replyText.trim() !== '') {
                onSendReply(msg.id, replyText);
                setReplyInputTexts(prev => ({ ...prev, [msg.id]: '' }));
              }
            }}
            style={{ display: 'flex', gap: '6px', marginTop: '4px' }}
          >
            <input 
              type="text"
              placeholder="Écrire une réponse..."
              value={replyInputTexts[msg.id] || ''}
              onChange={(e) => setReplyInputTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(0, 255, 204, 0.2)',
                borderRadius: '6px',
                padding: '5px 8px',
                color: '#fff',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: 'rgba(0, 255, 204, 0.15)',
                border: '1px solid rgba(0, 255, 204, 0.3)',
                borderRadius: '6px',
                color: '#00ffcc',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={10} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
