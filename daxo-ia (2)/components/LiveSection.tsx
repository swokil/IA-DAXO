
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encodeBase64, decodeBase64, decodeAudioData } from '../services/geminiService';

const LiveSection: React.FC = () => {
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopLive = useCallback(() => {
    setIsLive(false);
    setIsConnecting(false);
    
    if (sessionRef.current) {
      /* Properly close the Gemini Live session */
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (outAudioContextRef.current) {
      outAudioContextRef.current.close();
      outAudioContextRef.current = null;
    }

    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  }, []);

  const startLive = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Create a new instance right before the call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              const pcmBlob = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              // Use sessionPromise to ensure data is sent to the resolved session
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: any) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decodeBase64(audioData),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
              };

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error(e);
            setError("Une erreur est survenue lors de la connexion.");
            stopLive();
          },
          onclose: () => {
            stopLive();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: 'Tu es OmniMind en version vocale. Sois chaleureux, concis et réponds en français.',
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError("Impossible d'accéder au microphone ou d'établir la connexion.");
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopLive();
  }, [stopLive]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full glass rounded-3xl p-8 flex flex-col items-center gap-12 border border-slate-800 relative overflow-hidden">
        {/* Animated Orbs */}
        {isLive && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500 rounded-full blur-[80px] animate-pulse"></div>
          </div>
        )}

        <div className="text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            GEMINI LIVE API
          </div>
          <h2 className="text-3xl font-bold">Conversation Vocale</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">Parlez naturellement avec OmniMind. L'IA vous écoute et vous répond en temps réel.</p>
        </div>

        {/* Visualizer Circle */}
        <div className="relative flex items-center justify-center z-10">
          <div className={`absolute w-48 h-48 rounded-full border-4 transition-all duration-700 ${isLive ? 'border-blue-500 scale-110 opacity-40 animate-ping' : 'border-slate-800 scale-100 opacity-100'}`}></div>
          <div className={`absolute w-48 h-48 rounded-full border-2 transition-all duration-500 ${isLive ? 'border-blue-400 scale-125 opacity-20' : 'border-slate-800'}`}></div>
          
          <div className={`w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-500 ${isLive ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.4)]' : 'bg-slate-800'}`}>
            {isLive ? <Volume2 className="w-16 h-16 text-white" /> : <Bot className="w-16 h-16 text-slate-500" />}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/20 text-sm relative z-10">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={isLive ? stopLive : startLive}
          disabled={isConnecting}
          className={`relative z-10 w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${isLive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] shadow-xl shadow-blue-600/20'}`}
        >
          {isConnecting ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : isLive ? (
            <>
              <MicOff className="w-6 h-6" /> Arrêter la conversation
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" /> Commencer à parler
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-500 uppercase tracking-widest relative z-10">Technologie Gemini 2.5 Flash Native Audio</p>
      </div>
    </div>
  );
};

export default LiveSection;
