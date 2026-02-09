
import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Image as ImageIcon, X, ExternalLink, User, Bot, Loader2, Volume2, PlayCircle } from 'lucide-react';
import { chatWithDaxoStream, generateDaxoSpeech, decodeBase64, decodeAudioData } from '../services/geminiService';
import { ChatMessage } from '../types';
import { GenerateContentResponse } from "@google/genai";

const ChatSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('daxo_chat_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('daxo_chat_v2', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSpeech = async (text: string, msgId: string) => {
    if (isSpeaking) return;
    setIsSpeaking(msgId);
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const base64Audio = await generateDaxoSpeech(text);
      if (base64Audio) {
        const audioData = decodeBase64(base64Audio);
        const buffer = await decodeAudioData(audioData, audioCtxRef.current, 24000, 1);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsSpeaking(null);
        source.start();
      }
    } catch (error) {
      console.error(error);
      setIsSpeaking(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const imageParts = currentImage ? [{
        inlineData: {
          data: currentImage.split(',')[1],
          mimeType: 'image/png'
        }
      }] : [];

      const result = await chatWithDaxoStream(currentInput, history, imageParts, isSearching);
      
      let fullText = "";
      const modelMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      let lastChunk: GenerateContentResponse | null = null;
      for await (const chunk of result) {
        lastChunk = chunk;
        const textChunk = chunk.text;
        if (textChunk) {
          fullText += textChunk;
          setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText } : m));
        }
      }

      if (lastChunk) {
        const sources = lastChunk.candidates?.[0]?.groundingMetadata?.groundingChunks
          ?.map((chunk: any) => ({
            title: chunk.web?.title || 'Source',
            uri: chunk.web?.uri || ''
          })).filter((s: any) => s.uri) || [];

        if (sources.length > 0) {
          setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, sources } : m));
        }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Daxo a rencontré une erreur technique. Vérifie ta clé API.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 lg:px-6">
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-10 space-y-8 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-blue-500/30">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-3xl font-black text-white">DAXO <span className="text-blue-500">IA</span></h3>
              <p className="text-slate-400 font-medium">Assistant Ultra-Performant. Prêt pour vos requêtes les plus complexes.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-5 animate-fade ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
            </div>
            <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] space-y-3 ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`px-5 py-4 rounded-3xl leading-relaxed text-[15px] relative group ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-[#111] border border-white/5 shadow-2xl rounded-tl-none text-slate-200'}`}>
                {msg.image && (
                  <img src={msg.image} alt="Media" className="max-w-xs rounded-xl mb-4 border border-white/10" />
                )}
                <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                   {msg.text}
                </div>
                
                {msg.role === 'model' && msg.text && (
                  <button 
                    onClick={() => handleSpeech(msg.text, msg.id)}
                    className={`absolute -right-12 top-0 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 ${isSpeaking === msg.id ? 'opacity-100 text-blue-400 animate-pulse' : ''}`}
                    title="Écouter la réponse"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {msg.sources && (
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] bg-white/5 hover:bg-white/10 text-blue-400 px-3 py-1.5 rounded-full border border-white/5 font-bold transition-all">
                      <ExternalLink className="w-3 h-3" /> {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && !messages[messages.length-1]?.text && (
          <div className="flex gap-5 animate-pulse">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
            <div className="bg-[#111] border border-white/5 px-6 py-4 rounded-3xl rounded-tl-none h-16 w-48"></div>
          </div>
        )}
      </div>

      <div className="pb-10 px-2">
        <div className="glass border border-white/10 rounded-3xl p-3 shadow-2xl relative">
          {selectedImage && (
            <div className="absolute -top-24 left-4 p-2 bg-black/80 rounded-2xl border border-white/10 flex items-center gap-3">
              <img src={selectedImage} className="w-16 h-16 object-cover rounded-xl" />
              <button onClick={() => setSelectedImage(null)} className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/40">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
             <div className="flex items-center">
                <button 
                  onClick={() => setIsSearching(!isSearching)}
                  className={`p-3 rounded-2xl transition-all ${isSearching ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
                  title="Web Search"
                >
                  <Search className="w-5 h-5" />
                </button>
                <label className="p-3 text-slate-500 hover:bg-white/5 rounded-2xl cursor-pointer transition-all">
                  <ImageIcon className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
             </div>

            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez une question à Daxo..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white py-3 px-4 text-lg font-medium outline-none placeholder:text-slate-600"
            />

            <button 
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className={`p-4 rounded-2xl transition-all ${(!input.trim() && !selectedImage) || isLoading ? 'bg-white/5 text-slate-700' : 'bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-xl shadow-blue-600/30'}`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
