
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
  ShoppingBag,
  BarChart3,
  Heart
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  companyName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, companyName }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'quotes', label: 'Orçamentos', icon: FileText },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Fecha a sidebar no mobile após selecionar
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-950 text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:opacity-0'} lg:relative lg:translate-x-0`}>
        <div className="p-6 flex items-center justify-between min-w-[256px]">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight truncate w-40 text-indigo-50">{companyName || 'Meu Negócio'}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Sistema Ativo</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/10 p-1 rounded-lg"><X className="h-6 w-6" /></button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto min-w-[256px]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center w-full px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200 group ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 translate-x-1' : 'text-indigo-300 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className={`mr-3 h-5 w-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-indigo-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer info fixo */}
        <div className="p-4 border-t border-white/10 min-w-[256px] bg-indigo-950/50 backdrop-blur-sm">
          <div className="mb-4 px-4 py-2 bg-indigo-900/40 rounded-xl flex items-center justify-center gap-2 border border-white/5">
            <Heart className="h-3 w-3 text-red-400 fill-red-400" />
            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-tight">Feito para Emanuele</span>
          </div>
          <button onClick={onLogout} className="flex items-center w-full px-4 py-3.5 text-sm font-black text-indigo-400 rounded-2xl hover:bg-red-950/40 hover:text-red-300 transition-all border border-transparent hover:border-red-900/30">
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b h-16 flex items-center px-6 justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 lg:hidden transition-colors">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-indigo-600 rounded-full" />
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {menuItems.find(i => i.id === activeTab)?.label}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black text-gray-400 uppercase leading-none">Status</span>
                <span className="text-[11px] font-bold text-green-600 uppercase">Offline Ready</span>
             </div>
             <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-100">
                {companyName ? companyName.charAt(0).toUpperCase() : 'M'}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
