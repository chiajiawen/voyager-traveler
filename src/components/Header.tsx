import React from "react";
import {
  Compass,
  MessageSquare,
  Sparkles,
  Layers,
  MapPin,
  RefreshCw,
  Wallet,
  Sun,
  Moon,
  Server,
} from "lucide-react";
import { TripContext } from "../types";
import { useTheme } from "../context/ThemeContext";

interface Props {
  activeTab: "ask" | "plan";
  onTabChange: (tab: "ask" | "plan") => void;
  context: TripContext;
  onOpenArchitecture: () => void;
  onOpenMcpStatus: () => void;
  onNewChat: () => void;
  isAskBusy: boolean;
  mcpConnectedCount?: number;
  mcpTotalCount?: number;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  context,
  onOpenArchitecture,
  onOpenMcpStatus,
  onNewChat,
  isAskBusy,
  mcpConnectedCount = 0,
  mcpTotalCount = 11,
}) => {
  const { actualTheme, toggleTheme } = useTheme();

  const hasContext = Boolean(
    context.destination || context.origin_city || context.budget
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                GlobeAgent
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-[10px] font-semibold text-cyan-800 dark:text-cyan-400 font-mono">
                MCP 10-DIM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              Multi-Agent Travel Intelligence & Trip Planner
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onTabChange("ask")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ask"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
          <button
            onClick={() => onTabChange("plan")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "plan"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plan</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Context indicator */}
          {hasContext && (
            <div
              className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              title="Active context from trip form"
            >
              <MapPin className="w-3 h-3 text-cyan-500" />
              <span className="font-medium text-[11px] truncate max-w-[120px]">
                {context.origin_city || "Anywhere"} →{" "}
                {context.destination || "Shortlist"}
              </span>
              {context.budget && (
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
                  <Wallet className="w-2.5 h-2.5" />
                  {context.budget} {context.currency || "SGD"}
                </span>
              )}
            </div>
          )}

          {/* MCP Servers Connection Button */}
          <button
            onClick={onOpenMcpStatus}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all shrink-0"
            title="Inspect MCP Servers & Live Connections"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  mcpConnectedCount > 0 ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  mcpConnectedCount > 0 ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <Server className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline font-mono text-[11px]">
              Servers ({mcpTotalCount})
            </span>
          </button>

          {/* New Chat Button (only visible in Ask mode) */}
          {activeTab === "ask" && (
            <button
              onClick={onNewChat}
              disabled={isAskBusy}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors disabled:opacity-50"
              title="Clear conversation history"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span className="hidden md:inline">New Chat</span>
            </button>
          )}

          {/* Architecture diagram toggle */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800/40 transition-colors"
            title="Inspect Agent Orchestrator Architecture"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flow</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title={`Switch to ${actualTheme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle theme"
          >
            {actualTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-blue-600 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
