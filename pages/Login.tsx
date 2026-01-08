
import React, { useState, useEffect } from 'react';
import { Lock, User, Briefcase, ShieldCheck, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';
import { CompanySettings, ProductMode } from '../types';

interface LoginProps {
  onLogin: (password: string, initialData?: Partial<CompanySettings>) => void;
  settings: CompanySettings | null;
  isInitialSetup: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, settings, isInitialSetup }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [particles, setParticles] = useState<{ id: number; left: string; delay: string; duration: string; size: string }[]>([]);

  useEffect(() => {
    // Gerar partículas dinamicamente para o fundo
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${15 + Math.random() * 20}s`,
      size: `${2 + Math.random() * 4}px`
    }));
    setParticles(newParticles);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isInitialSetup) {
      if (!companyName.trim() || !ownerName.trim() || !password.trim()) {
        setError('Campos fundamentais não preenchidos.');
        return;
      }
      onLogin(password, {
        companyName,
        ownerName,
        phone,
        defaultObservations: 'Orçamento exclusivo. Válido por 7 dias. Pagamento via PIX.',
        productMode: ProductMode.SIMPLE
      });
    } else {
      if (!password) {
        setError('Digite a chave mestra.');
        return;
      }
      if (settings?.password && settings.password !== password) {
        setError('Credencial incorreta.');
        return;
      }
      onLogin(password);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-950 via-blue-700 to-sky-400 overflow-hidden px-6">
      
      {/* Nuvens Estilizadas no Background */}
      <div className="cloud w-[400px] h-[300px] top-[10%] left-[-10%]" style={{ animationDuration: '40s' }}></div>
      <div className="cloud w-[600px] h-[400px] bottom-[10%] right-[-15%]" style={{ animationDuration: '60s', animationDelay: '5s' }}></div>
      <div className="cloud w-[300px] h-[200px] top-[50%] left-[20%]" style={{ animationDuration: '50s', animationDelay: '10s' }}></div>

      {/* Partículas flutuantes */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle" 
          style={{ 
            left: p.left, 
            animationDelay: p.delay, 
            animationDuration: p.duration,
            width: p.size,
            height: p.size
          }}
        ></div>
      ))}

      <div className="glass p-12 rounded-[50px] w-full max-w-lg z-10 transition-all duration-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-10">
        <div className="text-center mb-12">
          <div className="inline-flex relative mb-8">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-28 h-28 bg-white rounded-[35px] shadow-2xl border border-blue-50">
              {isInitialSetup ? (
                <Sparkles className="h-12 w-12 text-blue-600" />
              ) : (
                <ShieldCheck className="h-12 w-12 text-blue-600" />
              )}
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-indigo-950 tracking-tighter leading-none mb-4">
            {isInitialSetup ? 'Elevando a Gestão' : 'Bem-vinda, Elite'}
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] opacity-80">
            {isInitialSetup 
              ? 'Prepare-se para transformar seu negócio.' 
              : settings?.companyName || 'Workspace Privado'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {isInitialSetup && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-950/40 uppercase tracking-widest ml-1">Identidade da Empresa</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white/40 border border-white/60 rounded-3xl focus:bg-white focus:ring-8 focus:ring-blue-100/50 outline-none transition-all font-bold text-indigo-950 placeholder:text-slate-400"
                    placeholder="Nome do seu negócio"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-950/40 uppercase tracking-widest ml-1">Liderança</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white/40 border border-white/60 rounded-3xl focus:bg-white focus:ring-8 focus:ring-blue-100/50 outline-none transition-all font-bold text-indigo-950 placeholder:text-slate-400"
                    placeholder="Como devemos chamá-la?"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-950/40 uppercase tracking-widest ml-1">Chave de Segurança</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`w-full pl-14 pr-6 py-5 bg-white/40 border ${error ? 'border-red-400 ring-4 ring-red-100/50' : 'border-white/60'} rounded-3xl focus:bg-white focus:ring-8 focus:ring-blue-100/50 outline-none transition-all font-bold text-indigo-950 placeholder:text-slate-400`}
                placeholder="Sua senha exclusiva"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-red-50 rounded-2xl border border-red-100 text-red-600 animate-bounce">
                <CheckCircle2 className="h-4 w-4 rotate-180" />
                <span className="text-[10px] font-black uppercase tracking-wider">{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="glint group relative w-full bg-indigo-950 text-white font-black py-6 rounded-3xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 transform-gpu"
          >
            <div className="relative z-10 flex items-center justify-center gap-3 text-xs tracking-[0.2em]">
              {isInitialSetup ? 'INICIAR MINHA JORNADA' : 'ACESSAR DASHBOARD'}
              <LogIn className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </form>

        <div className="mt-14 text-center border-t border-indigo-900/10 pt-8">
          <p className="text-[9px] font-black text-indigo-950/30 uppercase tracking-[0.5em]">
            PROTECÇÃO INTEGRADA • CLOUD SYNC
          </p>
        </div>
      </div>
      
      {/* Assinatura no rodapé com estilo "Ghost" */}
      <div className="absolute bottom-10 flex items-center gap-4 opacity-40">
         <div className="h-px w-8 bg-white/50"></div>
         <p className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Emanuelle • João Ferrari</p>
         <div className="h-px w-8 bg-white/50"></div>
      </div>
    </div>
  );
};

export default Login;
