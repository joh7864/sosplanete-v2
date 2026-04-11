'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users } from 'lucide-react';

interface TopBarProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode; // Keep in interface to prevent compilation errors, but don't render
  selector?: React.ReactNode;
  actions?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ title, selector, actions }) => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setUserName(data.name || data.email || 'Utilisateur');
          setUserAvatar(data.avatar || '');
        }
      } catch (e) {
        console.error('Failed to fetch user context', e);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    router.push('/');
  };

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${baseUrl}${path}`;
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-10 py-3 bg-white border-b border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] -mx-6 -mt-6 lg:-mx-10 lg:-mt-10 mb-6 lg:mb-8 w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)]">
      
      {/* Dynamic Title and Badges */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">{title}</h1>
        {selector && (
          <div className="flex items-center">
            {selector}
          </div>
        )}
      </div>

      {/* Page Actions & Profile Menu */}
      <div className="flex items-center gap-6">
        {actions && (
          <div className="flex items-center gap-3 mt-1">
            {actions}
          </div>
        )}
        
        {/* separator */}
        <div className="hidden lg:block w-px h-6 bg-slate-100 mt-1"></div>

        {/* User Profile */}
        <div className="hidden lg:flex items-center gap-3 mt-1">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {userAvatar ? (
                <img src={getAvatarUrl(userAvatar) || ''} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Users size={14} className="text-slate-400" />
              )}
            </div>
            <span className="text-[13px] font-bold text-slate-700">{userName}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors ml-1" title="Déconnexion">
              <LogOut size={16} />
            </button>
        </div>
      </div>
    </header>
  );
};
