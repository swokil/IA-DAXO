
import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Download, Loader2, Wand2, Film, Key } from 'lucide-react';
import { generateDaxoVideo } from '../services/geminiService';

const VideoSection: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success after dialog
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const url = await generateDaxoVideo(prompt);
      setVideoUrl(url);
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Veuillez sélectionner une clé API valide.");
      } else {
        alert("Erreur de génération vidéo.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="p-6 bg-purple-600/20 rounded-full border border-purple-500/20">
          <Key className="w-12 h-12 text-purple-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold">Clé API Requise</h2>
          <p className="text-slate-400 text-sm">
            La génération de vidéos avec Veo nécessite une clé API issue d'un projet GCP avec facturation activée.
          </p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs hover:underline block mt-2">
            Consulter la documentation sur la facturation
          </a>
        </div>
        <button 
          onClick={handleSelectKey}
          className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20"
        >
          Sélectionner une Clé API
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="w-full lg:w-[400px] border-r border-white/5 bg-white/2 p-8 space-y-8 flex flex-col">
        <div className="space-y-3">
          <div className="p-3 w-fit bg-purple-600/20 rounded-2xl border border-purple-500/20">
            <Film className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-3xl font-black">DAXO <span className="text-purple-500">CINÉMA</span></h2>
          <p className="text-slate-500 text-sm font-medium">Créez des scènes cinématiques 720p avec le modèle Veo 3.1.</p>
        </div>

        <div className="space-y-6 flex-1">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez votre scène (ex: Un voyageur du temps arrivant dans le Paris de 1880 sous une pluie de néons)..."
            className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-white/5 text-slate-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 hover:scale-[1.02] shadow-xl shadow-purple-600/20'}`}
          >
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            {isGenerating ? 'Production en cours...' : 'Générer la vidéo'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black flex flex-col items-center justify-center p-10 relative">
        {videoUrl ? (
          <div className="w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
            <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
               <a href={videoUrl} download="daxo-cinéma.mp4" className="p-5 bg-white rounded-full text-black hover:scale-110 transition-transform pointer-events-auto shadow-2xl">
                 <Download className="w-8 h-8" />
               </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-6 max-w-sm opacity-30">
             <div className="w-40 h-40 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <Video className="w-16 h-16 text-white" />
             </div>
             <div>
                <h3 className="text-xl font-bold">Prêt pour le clap ?</h3>
                <p className="text-sm">Votre chef-d'œuvre apparaîtra ici. La génération peut prendre jusqu'à 1 minute.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSection;
