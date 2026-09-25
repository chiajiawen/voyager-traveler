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
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Multi-MCP Travel Orchestrator Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                End-to-end execution flow across the 10 travel dimensions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagram Flow */}
        <div className="py-6 flex flex-col items-center gap-3">
          {/* Node 1: User / Chat */}
          <div className="w-64 p-3 rounded-xl border border-cyan-300 dark:border-cyan-500/40 bg-cyan-50 dark:bg-cyan-950/20 flex items-center gap-3 text-cyan-900 dark:text-cyan-200 shadow-sm">
            <div className="p-2 rounded-lg bg-cyan-200 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">User / Chat</div>
              <div className="text-[11px] text-cyan-700 dark:text-cyan-400/80">
                Plain language queries & Plan inputs
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />

          {/* Node 2: AI Travel Agent */}
          <div className="w-64 p-3 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/20 flex items-center gap-3 text-indigo-900 dark:text-indigo-200 shadow-sm">
            <div className="p-2 rounded-lg bg-indigo-200 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">AI Travel Agent</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400/80">
                POST /api/ask & POST /api/plan
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />

          {/* Node 3: Travel Orchestrator */}
          <div className="w-64 p-3 rounded-xl border border-violet-300 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-950/20 flex items-center gap-3 text-violet-900 dark:text-violet-200 shadow-sm">
            <div className="p-2 rounded-lg bg-violet-200 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Travel Orchestrator</div>
              <div className="text-[11px] text-violet-700 dark:text-violet-400/80">
                Dynamic 10-Dimension Router
              </div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />

          {/* Node 4: MCP Servers Row */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            <div className="p-3 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/30 text-center flex flex-col items-center">
              <Server className="w-4 h-4 text-sky-600 dark:text-sky-400 mb-1" />
              <div className="font-semibold text-xs text-sky-900 dark:text-sky-200">Flight MCPs</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">flights, routes</div>
            </div>

            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-center flex flex-col items-center">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
              <div className="font-semibold text-xs text-emerald-900 dark:text-emerald-200">Stays & FX</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">stays, cost_exchange</div>
            </div>

            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-center flex flex-col items-center">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
              <div className="font-semibold text-xs text-amber-900 dark:text-amber-200">Visa & Weather</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">visa, weather, places</div>
            </div>
          </div>

          <ArrowDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />

          {/* Node 5: Output Itinerary & Verification */}
          <div className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white">
                  Validated Trip Plan & Chat Response
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Itemized line items, math verification, FX conversion & status
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold">
              Ground Truth
            </div>
          </div>
        </div>

        {/* Technical Highlights */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Design Highlights:
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Pre-Connect Dimensional Routing:</strong> The LLM analyzes
              questions against strict JSON schema to select required dimensions
              prior to acquiring socket connections.
            </li>
            <li>
              <strong>Parallel Execution & Graceful Degradation:</strong> MCP
              servers connect via Promise.allSettled with timeout controls;
              offline servers are flagged in logs without crashing the flow.
            </li>
            <li>
              <strong>Ground-Truth Budget Reconciliation:</strong> Sum of itemized
              line items is calculated programmatically and verified against the
              traveller's budget.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
