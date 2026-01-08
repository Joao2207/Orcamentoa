
import React, { useState, useEffect } from 'react';
import { db } from './db/database';
import { CompanySettings, ProductMode, PDFTheme } from './types';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Quotes from './pages/Quotes';
import QuoteEditor from './pages/QuoteEditor';
import SettingsPage from './pages/Settings';
import Reports from './pages/Reports';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<any>(null);

  const [stats, setStats] = useState({
    customersCount: 0,
    productsCount: 0,
    quotesCount: 0,
    approvedCount: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  });

  const loadSettings = async () => {
    const list = await db.settings.toArray();
    if (list.length === 0) {
      setIsInitialSetup(true);
    } else {
      setSettings(list[0]);
    }
  };

  const loadStats = async () => {
    const [customersCount, productsCount, quotesCount, quotes] = await Promise.all([
      db.customers.count(),
      db.products.count(),
      db.quotes.count(),
      db.quotes.toArray()
    ]);

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const approvedQuotes = quotes.filter(q => ['Aprovado', 'Produção iniciada', 'Entregue'].includes(q.status));
    const approvedCount = approvedQuotes.filter(q => q.status === 'Aprovado').length;

    const weeklyRevenue = approvedQuotes.filter(q => new Date(q.date) >= oneWeekAgo).reduce((acc, q) => acc + q.total, 0);
    const monthlyRevenue = approvedQuotes.filter(q => new Date(q.date) >= startOfMonth).reduce((acc, q) => acc + q.total, 0);

    setStats({ 
      customersCount, 
      productsCount, 
      quotesCount, 
      approvedCount,
      weeklyRevenue,
      monthlyRevenue
    });
  };

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  // Recarrega estatísticas sempre que a aba muda
  useEffect(() => {
    if (isAuthenticated) loadStats();
  }, [activeTab, isAuthenticated]);

  const handleLogin = async (password: string, initialData?: Partial<CompanySettings>) => {
    if (isInitialSetup && initialData) {
      const initialSettings: CompanySettings = {
        companyName: initialData.companyName || 'Meu Negócio',
        ownerName: initialData.ownerName || 'Proprietária',
        phone: initialData.phone || '',
        defaultObservations: initialData.defaultObservations || 'Orçamento válido por 15 dias.',
        productMode: initialData.productMode || ProductMode.SIMPLE,
        pdfTheme: PDFTheme.SIMPLE,
        password: password
      };
      await db.settings.add(initialSettings);
      setSettings(initialSettings);
      setIsInitialSetup(false);
    }
    setIsAuthenticated(true);
    loadStats();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} onAction={(tab) => {
          if (tab === 'quote-editor') {
            setCurrentQuote(null);
            setActiveTab('quote-editor');
          } else {
            setActiveTab(tab);
          }
        }} />;
      case 'customers':
        return <Customers />;
      case 'products':
        return <Products settings={settings} />;
      case 'quotes':
        return (
          <Quotes 
            settings={settings}
            onEdit={(quote) => {
              setCurrentQuote(quote);
              setActiveTab('quote-editor');
            }}
            onNew={() => {
              setCurrentQuote(null);
              setActiveTab('quote-editor');
            }}
            onStatusChanged={loadStats} // Callback para atualização instantânea
          />
        );
      case 'quote-editor':
        return (
          <QuoteEditor 
            settings={settings}
            initialQuote={currentQuote} 
            onBack={() => {
              setActiveTab('quotes');
              loadStats();
            }} 
          />
        );
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage settings={settings} onUpdate={setSettings} />;
      default:
        return <Dashboard stats={stats} onAction={setActiveTab} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        settings={settings} 
        isInitialSetup={isInitialSetup} 
      />
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
      companyName={settings?.companyName}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
