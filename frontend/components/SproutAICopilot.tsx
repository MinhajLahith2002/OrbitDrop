"use client";

import React, { useState } from "react";
import { X, Bot, Send, Sparkles, HelpCircle, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { FieldData } from "@/types/geo";

interface SproutAICopilotProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldData | null;
  telemetryData: any;
  selectedCrop: string;
  growthStage: string;
}

interface Message {
  sender: "user" | "sprout";
  text?: string;
  advice?: {
    topic: string;
    summary: string;
    details: string[];
    actionItem: string;
    recommendedWindow: string;
  };
}

export default function SproutAICopilot({
  isOpen,
  onClose,
  field,
  telemetryData,
  selectedCrop,
  growthStage,
}: SproutAICopilotProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "sprout",
      advice: {
        topic: "Welcome to Sprout AI",
        summary: `Hello farmer! I am your AI Agronomist Copilot for ${field ? field.name : "your farm"}.`,
        details: [
          `I am synchronized with NASA POWER satellite feeds and your ${field ? `${field.areaHectares.toFixed(1)} ha` : ""} parcel.`,
          "Ask me about your daily watering times, upcoming monsoon rain risks, or crop disease mitigation.",
        ],
        actionItem: "Select a question below or type your own question.",
        recommendedWindow: "Available 24/7",
      },
    },
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    "When should I run my pump today?",
    "Should I water if rain is coming tomorrow?",
    "How do I check if my plants are water-stressed?",
    "What diseases should I watch for in this stage?",
  ];

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { sender: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/sprout-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          context: {
            cropName: telemetryData?.cropDemand?.cropName || selectedCrop,
            growthStage,
            areaHectares: field?.areaHectares || 1.0,
            areaAcres: field?.areaAcres || 2.47,
            et0_mm: telemetryData?.evapotranspiration?.ET0_mm_per_day || 3.5,
            cropDeficit_mm: telemetryData?.cropDemand?.netDeficit_mm || 4.2,
            waterDemandLiters: telemetryData?.cropDemand?.grossWaterDemandLiters || 45000,
            pumpRuntime: telemetryData?.pumpRuntime?.formatted || "1h 35m",
            forecastRain48h_mm: telemetryData?.rainLockout?.totalForecastRain48h_mm || 0,
            isLockoutActive: telemetryData?.rainLockout?.isLockoutActive || false,
            avgMoisture: 22.5,
            region: field ? "Sri Lanka Agro Zone" : "Polonnaruwa",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "sprout", advice: data.advice }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "sprout",
          text: `Sprout AI encountered an error: ${err.message}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-100 text-sm">Sprout AI Agronomist</h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Paddy Agronomist & Alternate Wetting and Drying (AWD) Copilot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "user" ? (
                <div className="bg-cyan-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[80%] text-xs shadow-md">
                  {msg.text}
                </div>
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none p-4 max-w-[90%] text-xs space-y-2.5 shadow-md">
                  {msg.advice ? (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{msg.advice.topic}</span>
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                          {msg.advice.recommendedWindow}
                        </span>
                      </div>

                      <p className="text-slate-200 font-medium leading-relaxed">
                        {msg.advice.summary}
                      </p>

                      <ul className="space-y-1.5 text-slate-300">
                        {msg.advice.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5 text-[11px]">
                            <span className="text-emerald-400 font-bold mt-0.5">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 font-bold text-[11px]">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Action: {msg.advice.actionItem}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-300">{msg.text}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-xs text-slate-400 flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>Sprout AI is analyzing your parcel...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-5 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-emerald-950 hover:border-emerald-500/40 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-200 transition-all whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sprout AI about your field, water pump, or weather..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
