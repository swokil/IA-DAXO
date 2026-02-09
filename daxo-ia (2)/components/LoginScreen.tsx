
import React, { useState } from 'react';
import { Chrome, Apple, Phone, LayoutGrid, Loader2, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleAuth = async (provider: string, userEmail: string, name?: string) => {
    setLoadingProvider(provider);
    try {
      const user = await authService.signIn(userEmail, provider, name);
      onLogin(user);
    } catch (error) {
      alert("Erreur de connexion au serveur Daxo.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      alert("E-mail invalide.");
      return;
    }
    handleAuth('Email', email);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#050505] p-6 selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* Animating Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-[420px] w-full flex flex-col items-center animate-fade z-10">
        <div className="mb-10 flex flex-col items-center">
           <div className="w-20 h-20 gradient-primary rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-6 transform hover:scale-105 transition-transform">
             <LayoutGrid className="text-white w-10 h-10" />
           </div>
           <h1 className="text-xs font-black tracking-[0.4em] text-blue-500 uppercase mb-2">OmniMind Engine</h1>
           <h2 className="text-4xl font-bold text-white text-center leading-tight tracking-tighter">Bienvenue sur Daxo</h2>
        </div>

        <div className="w-full space-y-3.5 mb-8">
          <button 
            disabled={!!loadingProvider}
            onClick={() => handleAuth('Google', 'user.test@gmail.com', 'Alex Google')}
            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {loadingProvider === 'Google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />}
              <span>Continuer avec Google</span>
            </div>
          </button>
          
          <button 
            disabled={!!loadingProvider}
            onClick={() => handleAuth('Apple', 'apple.id@icloud.com', 'Utilisateur Apple')}
            className="w-full flex items-center justify-between px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {loadingProvider === 'Apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Apple className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              <span>Continuer avec Apple</span>
            </div>
          </button>
        </div>

        <div className="w-full flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-1 bg-white/5"></div>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Identification E-mail</span>
          <div className="h-[1px] flex-1 bg-white/5"></div>
        </div>

        <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={!!loadingProvider}
            className="w-full gradient-primary text-white font-bold py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/20"
          >
            {loadingProvider === 'Email' ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Accès instantané'}
          </button>
        </form>

        <p className="mt-10 text-[11px] text-slate-500 text-center leading-relaxed max-w-[280px]">
          En continuant, vous acceptez les <span className="text-slate-300 underline cursor-pointer">Conditions d'Utilisation</span> de la plateforme Daxo IA.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
