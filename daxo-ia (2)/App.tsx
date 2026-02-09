
import React, { useState, useEffect } from 'react';
import { AppTab, UserProfile } from './types';
import LoginScreen from './components/LoginScreen';
import ChatSection from './components/ChatSection';
import ImageSection from './components/ImageSection';
import VideoSection from './components/VideoSection';
import LiveSection from './components/LiveSection';
import { authService } from './services/authService';
import { MessageSquare, Image as ImageIcon, Video, Mic, Sparkles, LogOut, ShieldCheck, Wifi, WifiOff, User } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [apiReady, setApiReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Vérification de la session au démarrage
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);
    
    // Vérification de la clé API
    if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
      setApiReady(true);
    }
    
    setIsInitializing(false);
  }, []);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.signOut();
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-500 font-black text-xs uppercase tracking-widest">Initialisation Daxo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-slate-100 selection:bg-blue-500/30">
      {/* Header Premium */}
      <header className="flex items-center justify-between px-6 py-3 glass border-b border-white/5 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 gradient-primary rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tighter text-white flex items-center gap-1.5">
              DAXO <span className="text-blue-500">IA</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            </h1>
            <div className="flex items-center gap-2">
               <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Ultra Intel v2.2</span>
               {apiReady ? (
                 <span className="flex items-center gap-1 text-[8px] text-green-500 font-bold"><Wifi className="w-2 h-2" /> ONLINE</span>
               ) : (
                 <span className="flex items-center gap-1 text-[8px] text-red-500 font-bold"><WifiOff className="w-2 h-2" /> NO API KEY</span>
               )}
            </div>
          </div>
        </div>
        
        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center bg-white/[0.03] p-1 rounded-2xl border border-white/5">
          {[
            { id: AppTab.CHAT, icon: MessageSquare, label: 'Assistant' },
            { id: AppTab.IMAGE, icon: ImageIcon, label: 'Studio' },
            { id: AppTab.VIDEO, icon: Video, label: 'Cinéma' },
            { id: AppTab.LIVE, icon: Mic, label: 'Vocal' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'hover:bg-white/5 text-slate-500'}`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : ''}`} />
              <span className="font-bold text-xs uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-4 border-l border-white/10 group cursor-pointer relative">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-white leading-none mb-1">{user.name}</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Membre Cloud</span>
            </div>
            <div className="relative">
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl border border-white/10 shadow-lg group-hover:border-blue-500 transition-colors bg-white/5"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#050505] rounded-full"></div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-slate-500 hover:text-red-400"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          {activeTab === AppTab.CHAT && <ChatSection />}
          {activeTab === AppTab.IMAGE && <ImageSection />}
          {activeTab === AppTab.VIDEO && <VideoSection />}
          {activeTab === AppTab.LIVE && <LiveSection />}
        </div>
        
        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-around bg-black/80 backdrop-blur-2xl p-4 border-t border-white/5 z-50">
          {[
            { id: AppTab.CHAT, icon: MessageSquare },
            { id: AppTab.IMAGE, icon: ImageIcon },
            { id: AppTab.VIDEO, icon: Video },
            { id: AppTab.LIVE, icon: Mic }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110 shadow-xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5'}`}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </nav>
      </main>

      {/* Ambient FX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] bg-blue-600/5 rounded-full blur-[180px] animate-pulse"></div>
        <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] bg-purple-600/5 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};

export default App;
