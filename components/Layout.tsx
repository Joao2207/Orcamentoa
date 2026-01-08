
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Heart,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  children: React.FC | React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  companyName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, companyName }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Painel Central', icon: LayoutDashboard },
    { id: 'customers', label: 'Portfólio Clientes', icon: Users },
    { id: 'products', label: 'Catálogo Elite', icon: Package },
    { id: 'quotes', label: 'Orçamentos', icon: FileText },
    { id: 'reports', label: 'Finanças & Estatísticas', icon: BarChart3 },
    { id: 'settings', label: 'Preferências', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-40 lg:hidden transition-all" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-indigo-950 text-white flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="p-8 flex flex-col mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-black tracking-tighter truncate w-48 text-white">{companyName || 'Gestão'}</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:bg-white/10 p-2 rounded-xl transition-all"><X className="h-6 w-6" /></button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
            <span className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">Premium Workspace</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`group flex items-center justify-between w-full px-5 py-4 text-xs font-black rounded-2xl transition-all duration-300 uppercase tracking-widest ${activeTab === item.id ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className="flex items-center">
                <item.icon className={`mr-4 h-5 w-5 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {item.label}
              </div>
              {activeTab === item.id && <ChevronRight className="h-4 w-4 opacity-50" />}
            </button>
          ))}
        </nav>

        {/* Footer info com Assinaturas */}
        <div className="p-6 border-t border-white/5 bg-indigo-950/30">
          <div className="mb-6 px-4 py-4 bg-white/5 rounded-3xl border border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Heart className="h-3 w-3 text-red-500 fill-red-500" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Para Emanuelle</span>
            </div>
            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter opacity-50">BY JOÃO FERRARI</p>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center w-full px-4 py-4 text-[10px] font-black text-red-400/70 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all uppercase tracking-widest">
            <LogOut className="mr-3 h-4 w-4" /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b h-20 flex items-center px-8 justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 rounded-2xl text-slate-400 hover:bg-slate-100 lg:hidden transition-all shadow-sm border border-slate-100">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <h2 className="text-sm font-black text-indigo-950 uppercase tracking-[0.2em]">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-indigo-950 leading-none">OPERADOR ELITE</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Emanuelle</p>
             </div>
             <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white">
                {companyName ? companyName.charAt(0).toUpperCase() : 'A'}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            {children as any}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
