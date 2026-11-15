"use client";

import React from "react";
import { Bot, Sparkles } from "lucide-react";

interface FloatingSproutCopilotProps {
  onClick: () => void;
  cropName: string;
}

export default function FloatingSproutCopilot({ onClick, cropName }: FloatingSproutCopilotProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[1100]">
      <button
        onClick={onClick}
        className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-slate-950/95 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/50 hover:border-emerald-400 text-white shadow-2xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
        title="Open Sprout AI Paddy Agronomist Copilot"
      >
        {/* Glowing Indicator */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>

        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:rotate-12 transition-transform">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
            <span>Sprout AI Copilot</span>
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Paddy Agronomist Online
          </div>
        </div>
      </button>
    </div>
  );
}
