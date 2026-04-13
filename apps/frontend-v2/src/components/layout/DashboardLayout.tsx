'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Globe,
  ChevronRight,
  ChevronDown,
  Building2,
  Search,
  Bell
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { getAssetUrl } from '@/utils/assets';
import { getAuthData, setAuthData, removeAuthData, clearAuthData } from '@/utils/storage';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps & { collapsed?: boolean }> = ({ icon, label, href, active, onClick, collapsed }) => (
  <Link
    href={href}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`
      flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300
      ${active 
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }
      ${collapsed ? 'justify-center px-0 w-12 mx-auto' : ''}
    `}
  >
    <div className={collapsed ? 'scale-110' : ''}>{icon}</div>
    {!collapsed && <span className="font-medium truncate">{label}</span>}
  </Link>
);

const SidebarDashboardDropdown: React.FC<{
  active: boolean;
  instances: any[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onDashboardClick?: () => void;
  collapsed?: boolean;
}> = ({ active, instances, activeId, onSwitch, onDashboardClick, collapsed }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const router = useRouter();

  return (
    <div className="relative flex flex-col w-full">
      <button
        onClick={() => {
          if (collapsed) {
             router.push('/dashboard');
             return;
          }
          setIsOpen(!isOpen);
          if (onDashboardClick) onDashboardClick();
          router.push('/dashboard');
        }}
        title={collapsed ? "Dashboard" : undefined}
        className={`
          flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all duration-300 group
          ${active 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }
          ${collapsed ? 'justify-center px-0 w-12 mx-auto' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <LayoutDashboard size={20} className={collapsed ? 'scale-110' : ''} />
          {!collapsed && <span className="font-medium">Dashboard</span>}
        </div>
        {!collapsed && instances.length > 0 && (
          <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-40 group-hover:opacity-100`} />
        )}
      </button>

      <AnimatePresence>
        {!collapsed && isOpen && instances.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-800 rounded-xl mt-1 flex flex-col py-1 max-h-60 overflow-y-auto custom-scrollbar"
          >
             {instances.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => { onSwitch(inst.id.toString()); setIsOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left truncate ${activeId === inst.id.toString() ? 'text-emerald-400 font-bold bg-slate-700' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                >
                  <Building2 size={14} className="shrink-0" /> <span className="truncate">{inst.schoolName}</span>
                </button>
             ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode; role: 'AS' | 'AM' }> = ({ children, role }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  const [userName, setUserName] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return getAuthData('user_name') || '';
    }
    return '';
  });
  const [userRole, setUserRole] = React.useState(role);
  const [userAvatar, setUserAvatar] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  // Helper pour l'URL de l'avatar
  const getAvatarUrl = (path: string | null) => {
    return getAssetUrl(path);
  };

  const handleLogout = () => {
    clearAuthData();
    window.location.href = '/';
  };

  const [managedInstances, setManagedInstances] = React.useState<any[]>([]);
  const [activeInstanceId, setActiveInstanceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
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
          setUserRole(data.role);
          setUserAvatar(data.avatar || '');
          setAuthData('user_name', data.name || '');
          setAuthData('user_role', data.role);
        }
      } catch (e) {
        console.error('Failed to fetch profile', e);
      }
    };
    fetchProfile();

    // Check instances from local storage
    const savedInstances = getAuthData('managed_instances');
    const savedActiveId = getAuthData('active_instance_id');
    if (savedInstances) setManagedInstances(JSON.parse(savedInstances));
    if (savedActiveId) setActiveInstanceId(savedActiveId);

    const handleStorage = () => {
      const savedName = getAuthData('user_name');
      const savedAvatar = getAuthData('userAvatar');
      const latestInstances = getAuthData('managed_instances');
      const latestActiveId = getAuthData('active_instance_id');
      
      if (savedName) setUserName(savedName);
      if (savedAvatar) setUserAvatar(savedAvatar);
      if (latestInstances) setManagedInstances(JSON.parse(latestInstances));
      if (latestActiveId) setActiveInstanceId(latestActiveId);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getAmLink = (base: string) => {
    if (!activeInstanceId) return base;
    return `${base}${base.includes('?') ? '&' : '?'}instanceId=${activeInstanceId}`;
  };

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    // Initial responsive check
    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      setIsCollapsed(true);
    }
  }, []);

  const renderNavContent = (mobile = false) => {
    const closeMenu = () => { if (mobile) setIsMobileMenuOpen(false); };
    const collapsed = !mobile && isCollapsed;

    return (
      <nav className={`flex flex-col gap-2 ${mobile ? 'mt-2' : ''}`}>
        <SidebarDashboardDropdown
          active={isLinkActive('/dashboard') && ['/dashboard/users', '/dashboard/reference', '/dashboard/catalog', '/dashboard/organization', '/dashboard/settings'].every(forbidden => !isLinkActive(forbidden))}
          instances={managedInstances}
          activeId={activeInstanceId}
          onDashboardClick={closeMenu}
          collapsed={collapsed}
          onSwitch={(id) => {
             setAuthData('active_instance_id', id);
             setActiveInstanceId(id);
             window.dispatchEvent(new Event('storage'));
             closeMenu();
             router.push('/dashboard/organization');
          }}
        />
        
        {userRole === 'AS' && (
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Utilisateurs" 
            href="/dashboard/users"
            active={isLinkActive('/dashboard/users')}
            onClick={closeMenu}
            collapsed={collapsed}
          />
        )}

        <SidebarItem 
          icon={<Globe size={20} />} 
          label="Configuration" 
          href={getAmLink('/dashboard/organization')}
          active={isLinkActive('/dashboard/organization')}
          onClick={closeMenu}
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<LayoutDashboard size={20} />} 
          label="Suivi jeux" 
          href={getAmLink('/dashboard/tracking')}
          active={isLinkActive('/dashboard/tracking')}
          onClick={closeMenu}
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={<BookOpen size={20} />} 
          label="Catalogue" 
          href={getAmLink(userRole === 'AS' ? '/dashboard/reference' : '/dashboard/catalog')}
          active={isLinkActive('/dashboard/reference') || isLinkActive('/dashboard/catalog')}
          onClick={closeMenu}
          collapsed={collapsed}
        />
        
        <SidebarItem 
          icon={<Settings size={20} />} 
          label="Paramètres" 
          href="/dashboard/settings"
          active={isLinkActive('/dashboard/settings')}
          onClick={closeMenu}
          collapsed={collapsed}
        />
      </nav>
    );
  };

  if (!mounted) return <div className="min-h-screen bg-[var(--bg-primary)]" />;

  return (
    <div className="flex h-screen w-screen bg-slate-50 lg:p-2 overflow-hidden">
      <div className="flex flex-1 w-full h-full lg:rounded-2xl shadow-2xl overflow-hidden bg-[var(--bg-primary)] relative border border-slate-200/50">
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col h-full z-50 shrink-0 transition-all duration-300 ${isCollapsed ? 'w-24' : 'w-72'}`}>
        <div className={`flex-1 flex flex-col gap-8 h-full bg-slate-900 border-r border-slate-800 p-6 pt-8 transition-all duration-300 ${isCollapsed ? 'px-4' : 'p-6'}`}>
          <div className={`flex ${isCollapsed ? 'flex-col justify-center items-center gap-6' : 'items-center justify-between px-2'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                <img 
                  src={getAssetUrl('logo-sosplanete.png')} 
                  alt="SOS Planète" 
                  className="w-8 h-8 object-contain" 
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/logo.png' }} // Fallback local discret au cas où
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight text-white leading-none truncate">SOS Planète</span>
                  <span className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">v2.2.0</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-500 hover:text-white transition-all flex items-center justify-center"
              title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
            >
              <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
                <ChevronRight size={18} strokeWidth={2.5} />
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-x-hidden">
            {renderNavContent()}
          </div>


        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50/50 relative">
        <header className="flex justify-between items-center lg:hidden p-6 mb-2 bg-white border-b border-slate-100">
          <span className="font-bold text-lg text-slate-800">SOS Planète</span>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </header>

        <div className="p-4 lg:p-6 flex-1">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-72 h-full bg-slate-900 text-white p-6 shadow-2xl border-r border-slate-800 flex flex-col"
          >
             <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden">
                    <img src={getAssetUrl('logo-sosplanete.png')} alt="Logo" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="font-bold text-xl text-white">Menu</span>
               </div>
               <X className="cursor-pointer text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)} />
             </div>
             
             <div className="flex-1">
                {renderNavContent(true)}
             </div>

             {/* Profile & Logout section in mobile menu */}
             <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                    {userAvatar ? (
                      <img src={getAvatarUrl(userAvatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={18} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white truncate max-w-[150px]">{userName}</span>
                    <span className="text-xs text-slate-500">{userRole === 'AS' ? 'Administrateur' : 'Manager'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Déconnexion</span>
                </button>
             </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
};

// Deleted WorkspaceSwitcher

