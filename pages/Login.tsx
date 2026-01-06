
import React, { useState } from 'react';
import { Lock, User, Briefcase, Phone, ShieldCheck, LogIn } from 'lucide-react';
import { CompanySettings, ProductMode } from '../types';

interface LoginProps {
  onLogin: (password: string, initialData?: Partial<CompanySettings>) => void;
  settings: CompanySettings | null;
  isInitialSetup: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, settings, isInitialSetup }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Estados para o cadastro inicial
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isInitialSetup) {
      if (!companyName.trim() || !ownerName.trim() || !password.trim()) {
        setError('Preencha o nome da empresa, seu nome e a senha.');
        return;
      }
      onLogin(password, {
        companyName,
        ownerName,
        phone,
        defaultObservations: 'Orçamento válido por 7 dias. Formas de pagamento: A combinar.',
        productMode: ProductMode.SIMPLE
      });
    } else {
      if (!password) {
        setError('Por favor, digite sua senha.');
        return;
      }
      
      if (settings?.password && settings.password !== password) {
        setError('Senha incorreta. Tente novamente.');
        return;
      }
      onLogin(password);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-indigo-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-2xl mb-4 shadow-inner">
            {isInitialSetup ? (
              <ShieldCheck className="h-10 w-10 text-indigo-600" />
            ) : (
              <LogIn className="h-10 w-10 text-indigo-600" />
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {isInitialSetup ? 'Comece Aqui' : 'Login de Acesso'}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isInitialSetup 
              ? 'Configure seu perfil profissional para começar.' 
              : `Bem-vinda de volta, ${settings?.ownerName || 'Proprietária'}.`}
          </p>
          {!isInitialSetup && (
            <p className="text-indigo-600 font-bold text-sm mt-1 uppercase tracking-wider">
              {settings?.companyName}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isInitialSetup && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome da sua Empresa *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ex: Confeitaria da Joana"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Seu Nome (Proprietária) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Telefone de Contato</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {isInitialSetup ? 'Defina sua Senha de Acesso *' : 'Digite sua Senha'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`block w-full pl-10 pr-3 py-3 bg-gray-50 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-600 font-bold flex items-center">
              <span className="mr-1">⚠️</span> {error}
            </p>}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-black py-4 px-4 rounded-xl hover:bg-indigo-700 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 shadow-xl shadow-indigo-900/20 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {isInitialSetup ? 'SALVAR E ENTRAR' : 'ENTRAR NO SISTEMA'}
            <LogIn className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p>CONEXÃO LOCAL SEGURA (OFFLINE)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
