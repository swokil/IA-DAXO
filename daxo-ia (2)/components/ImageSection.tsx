
import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Wand2, Image as ImageIcon, Zap, Key } from 'lucide-react';
import { generateDaxoImage, improvePrompt } from '../services/geminiService';
import { GeneratedImage } from '../types';

const ImageSection: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [images, setImages] = useState<GeneratedImage[]>(() => {
    const saved = localStorage.getItem('daxo_images');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(images[0] || null);

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
      // Proceed immediately to avoid race conditions
      setHasApiKey(true);
    }
  };

  const handleImprove = async () => {
    if (!prompt.trim() || isImproving) return;
    setIsImproving(true);
    try {
      const betterPrompt = await improvePrompt(prompt);
      if (betterPrompt) setPrompt(betterPrompt);
    } catch (e) { console.error(e); }
    finally { setIsImproving(false); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const url = await generateDaxoImage(prompt);
      if (url) {
        const newImg = { id: Date.now().toString(), url, prompt, timestamp: Date.now() };
        const updated = [newImg, ...images].slice(0, 15);
        setImages(updated);
        setSelectedImage(newImg);
        localStorage.setItem('daxo_images', JSON.stringify(updated));
      }
    } catch (e: any) { 
      if (e.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("Veuillez sélectionner une clé API valide.");
      } else {
        alert("Erreur génération image.");
      }
    }
    finally { setIsGenerating(false); }
  };

  if (!hasApiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="p-6 bg-blue-600/20 rounded-full border border-blue-500/20">
          <Key className="w-12 h-12 text-blue-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold">Clé API Requise</h2>
          <p className="text-slate-400 text-sm">
            La génération d'images avec Gemini 3 Pro nécessite une clé API issue d'un projet GCP avec facturation activée.
          </p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline block mt-2">
            Consulter la documentation sur la facturation
          </a>
        </div>
        <button 
          onClick={handleSelectKey}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
        >
          Sélectionner une Clé API
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-[420px] bg-white/2 border-r border-white/5 p-8 overflow-y-auto space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">DAXO <span className="text-blue-500">STUDIO</span></h2>
          <p className="text-slate-500 font-medium">Générez des images hyper-réalistes en un clic.</p>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Un portrait d'astronaute en armure d'or, style néo-classique..."
              className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-700 focus:border-blue-500 outline-none resize-none transition-all"
            />
            <button 
              onClick={handleImprove}
              disabled={!prompt.trim() || isImproving}
              className="absolute bottom-4 right-4 p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
              title="Améliorer avec l'IA"
            >
              {isImproving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl transition-all ${isGenerating ? 'bg-white/5 text-slate-700' : 'bg-blue-600 text-white hover:scale-[1.02] shadow-blue-600/20'}`}
          >
            {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            {isGenerating ? 'Alchimie en cours...' : 'Générer l\'image'}
          </button>
        </div>

        <div className="space-y-4">
           <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[3px]">Galerie Personnelle</h4>
           <div className="grid grid-cols-3 gap-3">
             {images.map((img) => (
               <button key={img.id} onClick={() => setSelectedImage(img)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage?.id === img.id ? 'border-blue-500 scale-95 shadow-lg' : 'border-white/5 hover:border-white/20'}`}>
                 <img src={img.url} className="w-full h-full object-cover" />
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="flex-1 bg-black/90 p-8 flex items-center justify-center relative">
        {selectedImage ? (
          <div className="relative group animate-fade max-w-2xl w-full">
            <img src={selectedImage.url} className="rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10 w-full object-cover aspect-square" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[40px]">
               <a href={selectedImage.url} download="daxo-art.png" className="p-6 bg-white rounded-full text-black hover:scale-110 transition-all shadow-2xl">
                 <Download className="w-8 h-8" />
               </a>
            </div>
            <div className="absolute bottom-8 left-8 right-8 p-6 glass rounded-2xl backdrop-blur-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
               <p className="text-sm font-bold text-white line-clamp-2">{selectedImage.prompt}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 opacity-20">
             <div className="w-32 h-32 gradient-primary rounded-[40px] flex items-center justify-center animate-pulse">
                <Wand2 className="w-16 h-16 text-white" />
             </div>
             <p className="text-xl font-bold tracking-widest uppercase">Prêt à créer ?</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSection;
