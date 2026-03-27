"use client";

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, ExternalLink, Cpu } from 'lucide-react';
import { api } from '@/api';

export function OCRConfig() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await api.getOCRConfig();
        if (config?.api_key) setApiKey(config.api_key);
      } catch (err) {
        console.error("Failed to fetch OCR config", err);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      await api.updateOCRConfig({ api_key: apiKey });
      setStatus({ type: 'success', msg: 'Configuration enregistrée avec succès !' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Erreur lors de la sauvegarde.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 ml-[-8px] rounded-lg bg-emerald-500/10 text-emerald-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Configuration OCR (Groq)</h2>
          <p className="text-xs text-white/40">Utilisez l'intelligence de Groq pour scanner vos documents avec une précision maximale.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider ml-1">
            Clé API Groq
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-emerald-400 transition-colors">
              <Key className="w-4 h-4" />
            </div>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-24 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all shadow-inner"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-1">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/5 transition-all"
                title={showKey ? "Masquer" : "Afficher"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        {status && (
          <div className={`p-3 rounded-xl text-xs font-medium animate-in zoom-in-95 duration-300 border ${
            status.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {status.msg}
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              ?
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white/80">Comment obtenir ma clé Groq ?</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                Groq offre un moteur de traitement ultra-rapide. L'utilisation est gratuite jusqu'à un certain quota.
              </p>
            </div>
          </div>
          
          <ol className="space-y-3 ml-12">
            {[
              { step: "1", text: "Rendez-vous sur la console Groq Cloud.", link: "https://console.groq.com/keys" },
              { step: "2", text: "Créez un compte ou connectez-vous.", link: null },
              { step: "3", text: "Cliquez sur 'Create API Key' dans la section API Keys.", link: null },
              { step: "4", text: "Copiez la clé (elle commence par 'gsk_') et collez-la ci-dessus.", link: null }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-xs">
                <span className="text-white/20 font-mono font-bold">{item.step}.</span>
                <span className="text-white/60">{item.text}</span>
                {item.link && (
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-bold ml-1"
                  >
                    Console Groq <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
