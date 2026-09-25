import React, { useState } from "react";
import { ToolCallItem, UnavailableServer, TravelDimension } from "../types";
import { DimensionChip } from "./DimensionChip";
import {
  Wrench,
  AlertTriangle,
  Server,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

interface Props {
  toolCalls?: ToolCallItem[];
  unavailable?: UnavailableServer[];
  notCovered?: TravelDimension[];
  routingFallback?: boolean;
}

export const ToolCallsList: React.FC<Props> = ({
  toolCalls = [],
  unavailable = [],
  notCovered = [],
  routingFallback = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [expandedArgs, setExpandedArgs] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const hasTools = toolCalls.length > 0;
  const hasUnavailable = unavailable.length > 0;
  const hasNotCovered = notCovered.length > 0;

  if (!hasTools && !hasUnavailable && !hasNotCovered && !routingFallback) {
    return null;
  }

  const toggleArg = (idx: number) => {
    setExpandedArgs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyArgs = (idx: number, args: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(args, null, 2));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const failedCount = toolCalls.filter((t) => t.failed).length;

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden text-xs">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/60 cursor-pointer hover:bg-slate-900 transition-colors select-none border-b border-slate-800/60"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agent Tool Calls</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono text-[11px]">
              {toolCalls.length}
            </span>
          </div>

          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[11px]">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              {failedCount} failed
            </span>
          )}

          {routingFallback && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px]">
              Routing fallback active
            </span>
          )}
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          aria-label={isExpanded ? "Collapse tool calls" : "Expand tool calls"}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Tool Calls in Order */}
          {hasTools ? (
            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-0.5">
                Execution Order ({toolCalls.length})
              </div>
              <div className="space-y-1.5">
                {toolCalls.map((tc, idx) => {
                  const isArgsOpen = expandedArgs[idx] ?? true;
                  const isFailed = tc.failed;
                  const serverLabel = tc.label || tc.server || "unknown-server";

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border transition-all ${
                        isFailed
                          ? "bg-rose-950/30 border-rose-700/60 shadow-sm shadow-rose-950/40"
                          : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between px-3 py-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400">
                            {idx + 1}
                          </span>
                          <span
                            className={`font-mono font-medium ${
                              isFailed ? "text-rose-300" : "text-cyan-300"
                            }`}
                          >
                            {tc.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] font-mono border border-slate-700/50">
                            <Server className="w-2.5 h-2.5 text-slate-400" />
                            {serverLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isFailed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-900/50 text-rose-300 text-[10px] font-semibold border border-rose-700/50">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] font-medium border border-emerald-800/40">
                              Success
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleArg(idx)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Toggle arguments"
                          >
                            {isArgsOpen ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Arguments View */}
                      {isArgsOpen && (
                        <div className="px-3 pb-2.5 pt-0 border-t border-slate-800/50">
                          <div className="flex items-center justify-between my-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                              Arguments
                            </span>
                            <button
                              type="button"
                              onClick={() => copyArgs(idx, tc.args)}
                              className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 transition-colors"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-2 rounded bg-slate-950/90 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800/80 leading-relaxed max-h-48">
                            {Object.keys(tc.args || {}).length === 0
                              ? "{}"
                              : JSON.stringify(tc.args, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 italic py-1">
              No remote tool calls were required for this response.
            </div>
          )}

          {/* Not-Covered Dimensions in Grey */}
          {hasNotCovered && (
            <div className="pt-2 border-t border-slate-800/60">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span>Not Covered Dimensions (No Server Assigned)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {notCovered.map((dim) => (
                  <span
                    key={dim}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs"
                  >
                    <span>{dim}</span>
                    <span className="text-[10px] text-slate-500">(uncovered)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unavailable Servers in Grey */}
          {hasUnavailable && (
            <div className="pt-2 border-t border-slate-800/60">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-400" />
                <span>Unavailable Servers ({unavailable.length})</span>
              </div>
              <div className="space-y-1">
                {unavailable.map((srv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-400 font-medium">
                        {srv.label}
                      </span>
                      <span className="text-slate-600 text-[11px] font-mono">
                        ({srv.address})
                      </span>
                    </div>
                    <span className="text-slate-500 italic text-[11px]">
                      {srv.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
