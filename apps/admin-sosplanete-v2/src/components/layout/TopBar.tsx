'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, Users, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getAssetUrl } from '@/utils/assets';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface TopBarProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  selector?: React.ReactNode;
  actions?: React.ReactNode;
  bottomContent?: React.ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, selector, actions, bottomContent, className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  const showSettingsIcon = pathname === '/dashboard' || pathname.includes('/organization') || pathname.includes('/reference') || pathname.includes('/catalog');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getAuthData('access_token');
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
    removeAuthData('access_token');
    removeAuthData('user_role');
    router.push('/');
  };

  const getAvatarUrl = (path: string | null) => {
    return getAssetUrl(path);
  };

  return (
    <header className={`sticky items-start flex-col gap-0 top-0 z-40 flex px-0 lg:px-0 py-0 bg-white border-b border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 mb-0 lg:mb-0 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] ${className || ''}`}>
      <div className="flex w-full items-center justify-between px-6 lg:px-10 py-3">
      {/* Dynamic Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{subtitle}</p>}
      </div>

      {/* Page Actions, Selector & Profile Menu */}
      <div className="flex items-center gap-6">
        {actions && (
          <div className="flex items-center gap-3 mt-1">
            {actions}
          </div>
        )}

        {selector && (
          <div className="flex items-center mt-1">
            {selector}
          </div>
        )}
        
        {/* separator & Settings Icon */}
        <div className="flex items-center gap-4">
          {showSettingsIcon && (
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all mt-1"
              title="Paramètres"
            >
              <Settings size={18} />
            </button>
          )}
          <div className="hidden lg:block w-px h-6 bg-slate-200 mt-1"></div>
        </div>

        {/* User Profile */}
        <div className="hidden lg:flex items-center gap-3 mt-1 cursor-pointer group" onClick={() => router.push('/dashboard/settings?tab=profile')}>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-emerald-300 transition-all">
              {userAvatar ? (
                <img src={getAvatarUrl(userAvatar) || ''} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Users size={14} className="text-slate-400" />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[13px] font-bold text-slate-700 leading-tight group-hover:text-emerald-700 transition-colors">{userName}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              className="text-slate-300 hover:text-rose-500 transition-colors ml-1 p-1" 
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
        </div>
      </div>
     </div>

     {/* Bottom Content for Tabs etc. */}
     {bottomContent && (
       <div className="w-full flex items-center px-6 lg:px-10 overflow-x-auto custom-scrollbar">
         {bottomContent}
       </div>
     )}
    </header>
  );
};
