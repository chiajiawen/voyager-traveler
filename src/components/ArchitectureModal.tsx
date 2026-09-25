import React from "react";
import {
  X,
  Bot,
  Layers,
  Server,
  Database,
  CalendarCheck,
  Compass,
  ArrowDown,
  Shield,
  Zap,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Multi-MCP Travel Orchestrator Architecture
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end execution flow across the 10 travel dimensions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagram Flow */}
        <div className="py-6 flex flex-col items-center gap-3">
          {/* Node 1: User / Chat */}
          <div className="w-64 p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-center gap-3 text-cyan-200 shadow-sm shadow-cyan-950">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">User / Chat</div>
              <div className="text-[11px] text-cyan-400/80">
                Plain language queries & Plan inputs
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 2: AI Travel Agent */}
          <div className="w-64 p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20 flex items-center gap-3 text-indigo-200 shadow-sm shadow-indigo-950">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">AI Travel Agent</div>
              <div className="text-[11px] text-indigo-400/80">
                POST /api/ask & POST /api/plan
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 3: Travel Orchestrator */}
          <div className="w-64 p-3 rounded-xl border border-violet-500/40 bg-violet-950/20 flex items-center gap-3 text-violet-200 shadow-sm shadow-violet-950">
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Travel Orchestrator</div>
              <div className="text-[11px] text-violet-400/80">
                Dynamic 10-Dimension Router
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 4: MCP Servers Row */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/30 text-center flex flex-col items-center">
              <Server className="w-4 h-4 text-sky-400 mb-1" />
              <div className="font-semibold text-xs text-sky-200">Flight MCPs</div>
              <div className="text-[10px] text-slate-400">flights, routes</div>
            </div>
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-center flex flex-col items-center">
              <Server className="w-4 h-4 text-emerald-400 mb-1" />
              <div className="font-semibold text-xs text-emerald-200">Travel MCPs</div>
              <div className="text-[10px] text-slate-400">stays, weather, visa</div>
            </div>
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/30 text-center flex flex-col items-center">
              <Server className="w-4 h-4 text-amber-400 mb-1" />
              <div className="font-semibold text-xs text-amber-200">Maps & Rates</div>
              <div className="text-[10px] text-slate-400">transport, exchange</div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 5: Normalized Travel Data */}
          <div className="w-64 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center gap-3 text-emerald-200 shadow-sm">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Normalized Travel Data</div>
              <div className="text-[11px] text-emerald-400/80">
                10-dimension structured schema
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 6: Trip State / Itinerary Engine */}
          <div className="w-64 p-3 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-center gap-3 text-cyan-200 shadow-sm">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Trip State Engine</div>
              <div className="text-[11px] text-cyan-400/80">
                Budget verification & line-items
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-500" />

          {/* Node 7: Travel UI */}
          <div className="w-64 p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 flex items-center gap-3 text-rose-200 shadow-sm">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Travel UI + Chat</div>
              <div className="text-[11px] text-rose-400/80">
                Ask mode, Plan mode, Tool inspect
              </div>
            </div>
          </div>
        </div>

        {/* Security & Isolation Footnote */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">
              Zero Client-Side Credentials:
            </span>{" "}
            All MCP connection handshakes, tool invocations, and Gemini routing
            execute exclusively on the backend serverless endpoints. No keys are ever exposed to
            browser code.
          </div>
        </div>
      </div>
    </div>
  );
};
