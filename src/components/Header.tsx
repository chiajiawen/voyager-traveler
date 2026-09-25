import React from "react";
import {
  Compass,
  MessageSquare,
  Sparkles,
  Layers,
  MapPin,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { TripContext } from "../types";

interface Props {
  activeTab: "ask" | "plan";
  onTabChange: (tab: "ask" | "plan") => void;
  context: TripContext;
  onOpenArchitecture: () => void;
  onNewChat: () => void;
  isAskBusy: boolean;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  context,
  onOpenArchitecture,
  onNewChat,
  isAskBusy,
}) => {
  const hasContext = Boolean(
    context.destination || context.origin_city || context.budget
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                GlobeAgent
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-semibold text-cyan-400 font-mono">
                MCP 10-DIM
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multi-Agent Travel Intelligence & Trip Planner
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange("ask")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ask"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
          <button
            onClick={() => onTabChange("plan")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "plan"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Active Context indicator */}
          {hasContext && (
            <div
              className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
              title="Active context from trip form"
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span className="font-medium text-[11px]">
                {context.origin_city || "Anywhere"} →{" "}
                {context.destination || "Shortlist"}
              </span>
              {context.budget && (
                <span className="flex items-center gap-0.5 text-emerald-400 text-[11px] font-mono">
                  <Wallet className="w-2.5 h-2.5" />
                  {context.budget} {context.currency || "SGD"}
                </span>
              )}
            </div>
          )}

          {/* New Chat Button (only visible in Ask mode) */}
          {activeTab === "ask" && (
            <button
              onClick={onNewChat}
              disabled={isAskBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors disabled:opacity-50"
              title="Clear conversation history"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}

          {/* Architecture diagram toggle */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/40 transition-colors"
            title="Inspect Agent Orchestrator Architecture"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flow</span>
          </button>
        </div>
      </div>
    </header>
  );
};
