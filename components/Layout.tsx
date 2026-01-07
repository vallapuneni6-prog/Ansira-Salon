import React from 'react';
import { UserRole } from '../types';
import { dataService } from '../services/mockData';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  roles: UserRole[];
  contextRequired?: boolean;
}

const BRAND_LOGO_URL = "https://www.naturals.in/wp-content/uploads/2023/04/Naturals-Logo.png";

export const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, onLogout }) => {
  const user = dataService.getCurrentUser();
  const activeSalonId = dataService.getActiveSalonId();
  const [currentSalonName, setCurrentSalonName] = React.useState('Global View');

  React.useEffect(() => {
    const loadContext = async () => {
      const salon = await dataService.getActiveSalon();
      setCurrentSalonName(salon ? salon.name : 'Global View');
    };
    loadContext();
  }, [activeSalonId]);

  const handleLogout = () => {
    onLogout();
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'salons', label: 'Salons', icon: '🏛️', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { id: 'invoices', label: 'Sales', icon: '🧾', roles: [UserRole.MANAGER] },
    { id: 'staff', label: 'Personnel', icon: '👔', roles: [UserRole.MANAGER] },
    { id: 'managers', label: 'Managers', icon: '👤', roles: [UserRole.ADMIN] },
    { id: 'services', label: 'Services', icon: '📋', roles: [UserRole.ADMIN] },
    { id: 'package_templates', label: 'Package Templates', icon: '🎁', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { id: 'customers', label: 'Customers', icon: '👥', roles: [UserRole.ADMIN] },
    { id: 'payroll', label: 'Payroll', icon: '💰', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], contextRequired: true },
    { id: 'profit_loss', label: 'P&L Audit', icon: '📈', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], contextRequired: true },
    { id: 'vouchers', label: 'Vouchers', icon: '🎟️', roles: [UserRole.MANAGER] },
    { id: 'packages', label: 'Packages', icon: '🎁', roles: [UserRole.MANAGER] },
    { id: 'expenses', label: 'Expenses', icon: '💳', roles: [UserRole.MANAGER] },
    { id: 'admins', label: 'Admins', icon: '🔑', roles: [UserRole.SUPER_ADMIN] },
  ];

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 'SUPER ADMIN';
      case UserRole.ADMIN: return 'ADMIN';
      case UserRole.MANAGER: return 'MANAGER';
      default: return 'USER';
    }
  };

  const filteredNavItems = user ? navItems.filter(item => {
    const hasRole = item.roles.includes(user.role);
    if (!hasRole) return false;
    if (item.contextRequired && !activeSalonId) return false;
    if (item.id === 'customers' && (activeSalonId || user.role !== UserRole.ADMIN)) return false;
    return true;
  }) : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] font-sans">
      <aside className="w-full md:w-72 bg-white border-r border-slate-100 flex-shrink-0 z-20 flex flex-col shadow-sm">
        <div className="p-8 pb-4">
          <img 
            src={BRAND_LOGO_URL} 
            alt="Naturals Logo" 
            className="w-full max-w-[160px] h-auto object-contain"
          />
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-4">
            {user ? getRoleLabel(user.role) : ''}
          </p>
        </div>

        <nav className="px-6 py-6 space-y-1.5 flex-grow overflow-y-auto custom-scrollbar">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                activeView === item.id 
                  ? 'bg-[#7C3AED] text-white shadow-xl shadow-purple-200 scale-[1.02]' 
                  : 'text-slate-900 hover:bg-slate-50 font-medium'
              }`}
            >
              <span className={`text-xl transition-all ${activeView === item.id ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              <span className={`text-base tracking-tight ${activeView === item.id ? 'font-bold' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-50 mt-auto">
          <div className="flex items-center gap-4 mb-8 px-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shadow-inner">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Database Live</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2 py-2 text-rose-500 hover:text-rose-600 font-bold text-sm transition group"
          >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-12 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-50">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Context:</span>
              <span className="text-sm font-bold text-slate-900">{currentSalonName}</span>
            </div>
            {activeSalonId && user?.role !== UserRole.MANAGER && (
              <button 
                onClick={() => { dataService.setActiveSalonId(null); setActiveView('dashboard'); }}
                className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Exit Context ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end mr-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                <p className="text-[11px] font-bold text-emerald-500 uppercase">Postgres: Healthy</p>
             </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm border border-slate-50 relative group">
              <span className="text-lg">🔔</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-12 overflow-auto scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};