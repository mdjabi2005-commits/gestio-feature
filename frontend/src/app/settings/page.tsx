"use client";

import React from 'react';
import { OCRConfig } from '@/components/settings/OCRConfig';

export default function SettingsPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Paramètres</h1>
        <p className="text-sm text-white/40 mt-0.5">Configurez vos préférences et automations.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-xl bg-emerald-500/[0.02]">
          <OCRConfig />
        </div>
      </div>
    </div>
  );
}
