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

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, href, active }) => (
  <Link
    href={href}
    className={`
      flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-smooth
      ${active 
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }
    `}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const SidebarDashboardDropdown: React.FC<{
  active: boolean;
  instances: any[];
  activeId: string | null;
  onSwitch: (id: string) => void;
}> = ({ active, instances, activeId, onSwitch }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const router = useRouter();

  return (
    <div className="relative flex flex-col w-full">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          router.push('/dashboard');
        }}
        className={`
          flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-smooth group
          ${active 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </div>
        {instances.length > 0 && (
          <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-40 group-hover:opacity-100`} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && instances.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-800 rounded-xl mt-1 flex flex-col py-1"
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
      return localStorage.getItem('user_name') || '';
    }
    return '';
  });
  const [userRole, setUserRole] = React.useState(role);
  const [userAvatar, setUserAvatar] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  // Helper pour l'URL de l'avatar
  const getAvatarUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    return `${baseUrl}${path}`;
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const [managedInstances, setManagedInstances] = React.useState<any[]>([]);
  const [activeInstanceId, setActiveInstanceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
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
          setUserRole(data.role);
          setUserAvatar(data.avatar || '');
          localStorage.setItem('user_name', data.name || '');
          localStorage.setItem('user_role', data.role);
        }
      } catch (e) {
        console.error('Failed to fetch profile', e);
      }
    };
    fetchProfile();

    // Check instances from local storage
    const savedInstances = localStorage.getItem('managed_instances');
    const savedActiveId = localStorage.getItem('active_instance_id');
    if (savedInstances) setManagedInstances(JSON.parse(savedInstances));
    if (savedActiveId) setActiveInstanceId(savedActiveId);

    const handleStorage = () => {
      const savedName = localStorage.getItem('user_name');
      const savedAvatar = localStorage.getItem('userAvatar');
      const latestInstances = localStorage.getItem('managed_instances');
      const latestActiveId = localStorage.getItem('active_instance_id');
      
      if (savedName) setUserName(savedName);
      if (savedAvatar) setUserAvatar(savedAvatar);
      if (latestInstances) setManagedInstances(JSON.parse(latestInstances));
      if (latestActiveId) setActiveInstanceId(latestActiveId);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Suppression de la redirection forcée (Plan Premium Seamless)
  // On laisse l'utilisateur arriver sur le dashboard global

  const getAmLink = (base: string) => {
    if (role === 'AS') return base;
    return `${base}${base.includes('?') ? '&' : '?'}instanceId=${activeInstanceId}`;
  };

  const activeSchoolName = managedInstances.find(i => i.id.toString() === activeInstanceId)?.schoolName;

  if (!mounted) return <div className="min-h-screen bg-[var(--bg-primary)]" />;

  return (
    <div className="flex h-screen w-screen bg-slate-50 lg:p-2 overflow-hidden">
      <div className="flex flex-1 w-full h-full lg:rounded-2xl shadow-2xl overflow-hidden bg-[var(--bg-primary)] relative border border-slate-200/50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-full z-50 shrink-0">
        <div className="flex-1 flex flex-col gap-8 h-full bg-slate-900 border-r border-slate-800 p-6 pt-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/assets/logo.png" alt="SOS Planète" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">SOS Planète</span>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            <SidebarDashboardDropdown
              active={isLinkActive('/dashboard') && ['/dashboard/users', '/dashboard/reference', '/dashboard/organization', '/dashboard/catalog', '/dashboard/profile'].every(forbidden => !isLinkActive(forbidden))}
              instances={managedInstances}
              activeId={activeInstanceId}
              onSwitch={(id) => {
                 localStorage.setItem('active_instance_id', id);
                 setActiveInstanceId(id);
                 window.dispatchEvent(new Event('storage'));
                 router.push('/dashboard/organization');
              }}
            />
            
            {userRole === 'AS' ? (
              <>
                <SidebarItem 
                  icon={<Users size={20} />} 
                  label="Utilisateurs" 
                  href="/dashboard/users"
                  active={isLinkActive('/dashboard/users')}
                />
                <SidebarItem 
                  icon={<BookOpen size={20} />} 
                  label="Référentiel" 
                  href="/dashboard/reference"
                  active={isLinkActive('/dashboard/reference')}
                />
              </>
            ) : (
              <>
                <SidebarItem 
                  icon={<Globe size={20} />} 
                  label="Configuration" 
                  href={getAmLink('/dashboard/organization')}
                  active={isLinkActive('/dashboard/organization')}
                />
                <SidebarItem 
                  icon={<BookOpen size={20} />} 
                  label="Catalogue" 
                  href={getAmLink('/dashboard/catalog')}
                  active={isLinkActive('/dashboard/catalog')}
                />
              </>
            )}
            
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Mon Profil" 
              href="/dashboard/profile"
              active={isLinkActive('/dashboard/profile')}
            />
          </nav>
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

        <div className="p-6 lg:p-10 flex-1">
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
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            className="w-72 h-full bg-slate-900 text-white p-6 shadow-2xl border-r border-slate-800"
          >
             <div className="flex justify-between items-center mb-8">
               <span className="font-bold text-xl text-white">Menu</span>
               <X className="cursor-pointer" onClick={() => setIsMobileMenuOpen(false)} />
             </div>
             <nav className="flex flex-col gap-2">
                {/* Contenu mobile simplifié... */}
             </nav>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
};

// Deleted WorkspaceSwitcher

