'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, Users, Settings, Plus, Bell, Check, Lock, Unlock } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getAssetUrl } from '@/utils/assets';
import { getAuthData } from '@/utils/storage';
import { ChevronDown, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InitializeYearModal } from '@/components/organization/InitializeYearModal';
import { useSchoolYear } from '@/hooks/useSchoolYear';
import { useSession } from '@/hooks/useSession';

interface TopBarProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  selector?: React.ReactNode;
  actions?: React.ReactNode;
  bottomContent?: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  showStatusIndicator?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, selector, actions, bottomContent, className, isOpen, showStatusIndicator }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { schoolYear, setSchoolYear } = useSchoolYear();
  const { user, logout } = useSession();
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [showInitConfirm, setShowInitConfirm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [nextYear, setNextYear] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);

  const showSettingsIcon = pathname === '/dashboard' || pathname.includes('/organization') || pathname.includes('/reference') || pathname.includes('/catalog');
  const hideYearSelector = pathname.includes('/dashboard/users') || pathname.includes('/dashboard/reference') || pathname.includes('/dashboard/catalog') || pathname.includes('/dashboard/players') || pathname.includes('/dashboard/profile');

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/years`, {
          headers: { Authorization: `Bearer ${getAuthData('access_token')}` },
        });
        if (resp.ok) {
          const years = await resp.json();
          setAvailableYears(years);
        }
      } catch (e) {
        console.error('Failed to fetch school years', e);
      }
    };
    fetchYears();
  }, []);

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = getAuthData('access_token');
      if (!token) return;
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setNotifications(data);
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = () => setIsNotifOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleNotifClick = async (notif: any) => {
    setIsNotifOpen(false);
    if (!notif.isRead) {
      try {
        const token = getAuthData('access_token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) setNotifications(await resp.json());
      } catch (e) {
        console.error(e);
      }
    }

    if (notif.title.toLowerCase().includes('constantes') || notif.title.toLowerCase().includes('initialisé')) {
      router.push('/dashboard/organization?tab=general');
    } else {
      router.push('/dashboard/settings?tab=profile');
    }
  };

  const handleCreateYear = async (year: string) => {
    setIsInitializing(true);
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stimulation/initialize-year`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthData('access_token')}` 
        },
        body: JSON.stringify({ schoolYear: year }),
      });
      
      if (resp.ok) {
        setAvailableYears(prev => [...prev, year].sort());
        setSchoolYear(year); // Le hook propage automatiquement à tous les composants
        setIsYearOpen(false);
        setShowInitConfirm(false);
      }
    } catch (e) {
      console.error('Failed to initialize year', e);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogout = () => {
    logout(); // Le hook nettoie le state et redirige
  };

  const getAvatarUrl = (path: string | null) => {
    return getAssetUrl(path);
  };

  return (
    <header className={`sticky items-start flex-col gap-0 top-0 z-40 flex px-0 lg:px-0 py-0 bg-white border-b border-slate-100/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 mb-0 lg:mb-0 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] ${className || ''}`}>
      <div className="flex w-full items-center justify-between px-6 lg:px-10 py-3">
      {/* Dynamic Title */}
      <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
        {showStatusIndicator && (
          <div 
            className={`flex items-center justify-center p-2.5 rounded-2xl border transition-all cursor-help shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
              isOpen 
                ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100 hover:bg-emerald-100/60' 
                : 'bg-rose-50/80 text-rose-600 border-rose-100 hover:bg-rose-100/60'
            }`}
            title={isOpen ? "Espace ouvert — Les élèves peuvent se connecter et saisir des actions" : "Espace fermé — Les connexions et saisies d'actions sont bloquées"}
          >
            {isOpen ? <Unlock size={18} className="animate-pulse text-emerald-600" /> : <Lock size={18} className="text-rose-600" />}
          </div>
        )}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight leading-none">{title}</h1>
          {subtitle && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{subtitle}</p>}
        </div>
      </div>

      {/* Page Actions, Selector & Profile Menu */}
      <div className="flex items-center gap-6">
        {/* Global School Year Selector */}
        {!hideYearSelector && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsYearOpen(!isYearOpen)}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-950 shadow-lg shadow-emerald-950/20 transition-all group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[13px] font-black text-white tracking-wider">{schoolYear}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 group-hover:text-emerald-400 ${isYearOpen ? 'rotate-180 text-emerald-400' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isYearOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 5 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-1 w-48 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 z-50 p-2"
                >
                  <div className="mb-2 px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
                    Année Scolaire
                  </div>
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        setSchoolYear(year); // Le hook propage automatiquement
                        setIsYearOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${schoolYear === year ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-slate-850 hover:text-white'}`}
                    >
                      {year}
                    </button>
                  ))}
                  
                  {user?.role === 'AS' && (
                    <div className="border-t border-slate-800 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setShowInitConfirm(true);
                          setIsYearOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black text-emerald-400 hover:bg-slate-850 transition-all"
                      >
                        <Plus size={14} /> Nouvelle année
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

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
        
        {/* separator, Bell Icon & Settings Icon */}
        <div className="flex items-center gap-4 relative">
          
          {/* Bell Notifications */}
          <div className="relative mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsNotifOpen(!isNotifOpen); }}
              className={`p-2 rounded-xl transition-all relative ${isNotifOpen ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.filter((n: any) => !n.isRead).length > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 5, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 z-50 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Notifications</span>
                    {notifications.filter((n: any) => !n.isRead).length > 0 && (
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                        {notifications.filter((n: any) => !n.isRead).length} nouvelles
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs font-bold text-slate-400 italic">
                        Aucune notification
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notif: any) => {
                        const dateStr = new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        let statusColor = 'bg-slate-300';
                        let statusText = '';
                        if (!notif.isRead && notif.status === 'PENDING') {
                          statusColor = 'bg-amber-400 animate-pulse';
                          statusText = 'En attente';
                        } else if (notif.status === 'PROCESSED') {
                          statusColor = 'bg-emerald-500';
                          statusText = 'Traité';
                        } else if (notif.status === 'DELETED') {
                          statusColor = 'bg-rose-400';
                          statusText = 'Annulé';
                        }

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col gap-1.5 relative ${!notif.isRead ? 'bg-emerald-50/10' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                                <span className="text-[11px] font-black text-slate-800 truncate max-w-[180px]">{notif.title}</span>
                              </div>
                              <span className="text-[9px] font-medium text-slate-400 shrink-0">{dateStr}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-normal line-clamp-2">{notif.content}</p>
                            
                            {notif.status === 'PROCESSED' && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mt-1 inline-flex items-center gap-1">
                                <Check size={10} /> Accéder à mon espace →
                              </span>
                            )}
                            {notif.status === 'DELETED' && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 mt-1">
                                Demande annulée
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex justify-center">
                    <button
                      onClick={() => { setIsNotifOpen(false); router.push('/dashboard/settings?tab=profile'); }}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      Voir tout l'historique
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showSettingsIcon && (
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all mt-1"
              title="Paramètres"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>
      
      <InitializeYearModal 
        isOpen={showInitConfirm}
        onClose={() => setShowInitConfirm(false)}
        onConfirm={handleCreateYear}
        currentYears={availableYears}
        isLoading={isInitializing}
      />
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
