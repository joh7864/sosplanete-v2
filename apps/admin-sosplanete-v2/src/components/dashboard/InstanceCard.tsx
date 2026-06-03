'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Globe, Users, Trash2, Edit3, Loader2, Lock, Unlock, Settings2, Leaf, Droplets, Trash
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { setAuthData } from '@/utils/storage';
import { formatEcoImpact } from '@/utils/format';

export interface Instance {
  id: number;
  schoolName: string;
  hostUrl: string | null;
  adminId: number | null;
  isOpen: boolean;
  admin: {
    id: number;
    email: string;
    name: string | null;
    avatar: string | null;
  } | null;
  _count: {
    teams: number;
    localActions: number;
  };
  playersCount: number;
  totalImpacts: {
    co2: number;
    water: number;
    waste: number;
  };
  totalActionsDone: number;
}

interface InstanceCardProps {
  instance: Instance;
  viewMode: 'grid' | 'list';
  userRole: string | null;
  amUsers: any[];
  activePopoverId: number | null;
  setActivePopoverId: (id: number | null) => void;
  updatingAdminId: number | null;
  onToggleStatus: (instance: Instance) => void;
  onAdminChange: (instanceId: number, newAdminId: number) => void;
  onDeleteClick: (instance: Instance) => void;
}

export function InstanceCard({
  instance,
  viewMode,
  userRole,
  amUsers,
  activePopoverId,
  setActivePopoverId,
  updatingAdminId,
  onToggleStatus,
  onAdminChange,
  onDeleteClick
}: InstanceCardProps) {
  const cardColor = instance.isOpen ? '#10b981' : '#fbbf24';

  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  if (viewMode === 'grid') {
    return (
      <GlassCard className="hover:scale-[1.02] transition-all cursor-pointer group overflow-hidden h-full border-none shadow-xl" padding="none">
        <div 
          className="h-1.5 w-full" 
          style={{ backgroundColor: cardColor }} 
        />
        <div className="p-5 flex flex-col justify-between h-full min-h-[220px]">
          {/* Header: Title & Action Icons */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-4">
              <Link 
                 href={`/dashboard/organization?instanceId=${instance.id}`}
                 className="hover:text-emerald-600 transition-colors inline-block max-w-full"
                 onClick={(e) => {
                   e.stopPropagation();
                   setAuthData('active_instance_id', instance.id.toString());
                   window.dispatchEvent(new Event('storage'));
                 }}
              >
                 <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight truncate">{instance.schoolName}</h3>
              </Link>
              {instance.hostUrl && (
                 <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">https://{instance.hostUrl}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {userRole === 'AS' && (
                <>
                  <Link 
                    href={`/dashboard/organization?instanceId=${instance.id}&tab=general`}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAuthData('active_instance_id', instance.id.toString());
                      window.dispatchEvent(new Event('storage'));
                    }}
                  >
                    <Edit3 size={16} />
                  </Link>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteClick(instance); }}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Middle Section: Stats */}
          <div className="flex items-center justify-between mb-6 border-y border-slate-50 py-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-emerald-600 leading-none">{(instance as any).teamsCount || 0}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Équipes</span>
              </div>
              <div className="w-px h-6 bg-slate-100" />
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-emerald-600 leading-none">{instance.playersCount || 0}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Joueurs</span>
              </div>
              <div className="w-px h-6 bg-slate-100" />
              <div className="flex flex-col items-center">
                <span className="text-base font-black text-emerald-600 leading-none">{instance.totalActionsDone || 0}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Actions</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <div className="flex items-center gap-2 justify-end">
                 <span className="text-xs font-black text-slate-800 tracking-tight">{formatEcoImpact(instance.totalImpacts?.co2 || 0, 'co2')}</span>
                 <Leaf size={16} className="text-emerald-500" />
              </div>
              <div className="flex items-center gap-2 justify-end">
                 <span className="text-xs font-black text-slate-800 tracking-tight">{formatEcoImpact(instance.totalImpacts?.water || 0, 'water')}</span>
                 <Droplets size={16} className="text-blue-500" />
              </div>
              <div className="flex items-center gap-2 justify-end">
                 <span className="text-xs font-black text-slate-800 tracking-tight">{formatEcoImpact(instance.totalImpacts?.waste || 0, 'waste')}</span>
                 <Trash size={16} className="text-amber-500" />
              </div>
            </div>
          </div>

          {/* Footer: Manager & Buttons */}
          <div className="flex items-center justify-between mt-auto">
            <div 
              className="flex items-center gap-2 relative group/popover"
              onClick={(e) => {
                e.stopPropagation();
                if (userRole === 'AS') setActivePopoverId(activePopoverId === instance.id ? null : instance.id);
              }}
            >
              <div className={`w-8 h-8 rounded-full bg-slate-50 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 transition-transform ${userRole === 'AS' ? 'group-hover/popover:scale-105 cursor-pointer' : ''} ${updatingAdminId === instance.id ? 'opacity-50' : ''}`}>
                {updatingAdminId === instance.id ? (
                  <Loader2 size={12} className="animate-spin text-emerald-500" />
                ) : instance.admin?.avatar ? (
                  <img src={getAvatarUrl(instance.admin.avatar) || ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={14} className="text-slate-300" />
                )}
              </div>
              <div className="flex flex-col min-w-0 pr-2">
                 <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Gestionnaire</span>
                 <span className={`text-xs text-slate-800 font-bold truncate max-w-[100px] leading-tight transition-colors ${userRole === 'AS' ? 'group-hover/popover:text-emerald-600 cursor-pointer' : ''}`}>
                    {instance.admin?.name || instance.admin?.email?.split('@')[0] || 'Non assigné'}
                 </span>
              </div>

              {/* Admin Selector Popover (Only AS) */}
              <AnimatePresence>
                {userRole === 'AS' && activePopoverId === instance.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -8, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Réassigner le gestionnaire</span>
                    </div>
                    <div className="max-h-[180px] overflow-y-auto p-1 custom-scrollbar">
                      {amUsers.map((user: any) => (
                        <button
                          key={user.id}
                          onClick={() => onAdminChange(instance.id, user.id)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${instance.adminId === user.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar ? <img src={getAvatarUrl(user.avatar) || ''} className="w-full h-full object-cover" /> : <Users size={14} className="text-slate-300" />}
                          </div>
                          <div className="flex flex-col items-start overflow-hidden text-left">
                            <span className="text-xs font-bold truncate w-full">{user.name || 'Sans nom'}</span>
                            <span className="text-[9px] text-slate-400 truncate w-full">{user.email}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
               <div className="relative group/status">
                  <button 
                     onClick={(e) => { e.stopPropagation(); onToggleStatus(instance); }}
                     className={`p-2.5 rounded-xl transition-all shadow-sm ${userRole === 'AS' ? 'active:scale-95' : 'cursor-default'} ${instance.isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                  >
                     {instance.isOpen ? <Unlock size={18} /> : <Lock size={18} />}
                  </button>
               </div>

              <div className="relative group/config">
                 <Link 
                    href={`/dashboard/organization?instanceId=${instance.id}`}
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all shadow-sm active:scale-95 border border-emerald-100 block"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAuthData('active_instance_id', instance.id.toString());
                      window.dispatchEvent(new Event('storage'));
                    }}
                 >
                    <Settings2 size={18} />
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 hover:bg-slate-50 transition-all border-none shadow-md">
       <div className="flex items-center gap-6">
          <div className={`p-3 rounded-2xl transition-colors ${instance.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {instance.isOpen ? <Globe size={24} /> : <Lock size={24} />}
          </div>
          <div className="flex-1">
            <Link 
              href={`/dashboard/organization?instanceId=${instance.id}`}
              className="hover:text-emerald-600 transition-colors"
              onClick={() => {
                setAuthData('active_instance_id', instance.id.toString());
                window.dispatchEvent(new Event('storage'));
              }}
            >
              <h3 className="font-black text-slate-800">{instance.schoolName}</h3>
            </Link>
            <div className="flex items-center gap-3 mt-1">
               <p className="text-xs text-slate-400 font-medium">{instance.hostUrl || 'Pas d\'URL'}</p>
            </div>
          </div>

          <div className="flex gap-8 text-center px-10 border-x border-slate-100">
             <div className="flex flex-col">
                <span className="text-lg font-black text-emerald-600 leading-none">{(instance as any).teamsCount || 0}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Équipes</span>
             </div>
             <div className="flex flex-col">
                <span className="text-lg font-black text-emerald-600 leading-none">{instance.playersCount || 0}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Joueurs</span>
             </div>
          </div>

          <div className="flex items-center gap-2 pr-2">
            {userRole === 'AS' && (
              <>
                <Link 
                  href={`/dashboard/organization?instanceId=${instance.id}&tab=general`}
                  className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAuthData('active_instance_id', instance.id.toString());
                    window.dispatchEvent(new Event('storage'));
                  }}
                >
                  <Edit3 size={18} />
                </Link>
                <button 
                  onClick={() => onDeleteClick(instance)}
                  className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <Link 
                href={`/dashboard/organization?instanceId=${instance.id}`}
                className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 ml-2"
                onClick={() => {
                  setAuthData('active_instance_id', instance.id.toString());
                  window.dispatchEvent(new Event('storage'));
                }}
            >
                <Settings2 size={18} />
            </Link>
          </div>
       </div>
    </GlassCard>
  );
}
