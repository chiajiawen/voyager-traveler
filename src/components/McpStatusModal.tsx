import React, { useState, useEffect } from "react";
import {
  X,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Key,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Wrench,
  Search,
} from "lucide-react";
import { McpServerInfo, McpHealthResponse, TravelDimension } from "../types";
import { DimensionChip } from "./DimensionChip";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onServerStatusUpdate?: (connectedCount: number, total: number) => void;
}

export const McpStatusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onServerStatusUpdate,
}) => {
  const [servers, setServers] = useState<McpServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingSingle, setTestingSingle] = useState<string | null>(null);
  const [smitheryKey, setSmitheryKey] = useState<string>(() => {
    return localStorage.getItem("voyager_smithery_key") || "";
  });
  const [filter, setFilter] = useState<"all" | "connected" | "auth" | "error">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Fetch servers list initially when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitial = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/servers");
        if (res.ok) {
          const data: McpHealthResponse = await res.json();
          setServers(data.servers);
          setLastChecked(data.checkedAt);
        }
      } catch (err) {
        console.error("Failed to load initial servers:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [isOpen]);

  const handleTestAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/servers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(smitheryKey ? { "x-smithery-key": smitheryKey } : {}),
        },
        body: JSON.stringify({ smithery_api_key: smitheryKey }),
      });

      if (res.ok) {
        const data: McpHealthResponse = await res.json();
        setServers(data.servers);
        setLastChecked(data.checkedAt);
        if (onServerStatusUpdate) {
          onServerStatusUpdate(data.connectedCount || 0, data.total);
        }
      }
    } catch (err) {
      console.error("Failed to test MCP servers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSingle = async (address: string) => {
    setTestingSingle(address);
    try {
      const res = await fetch(`/api/servers/test?address=${encodeURIComponent(address)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(smitheryKey ? { "x-smithery-key": smitheryKey } : {}),
        },
        body: JSON.stringify({
          address,
          smithery_api_key: smitheryKey,
        }),
      });

      if (res.ok) {
        const data: McpHealthResponse = await res.json();
        if (data.servers && data.servers.length > 0) {
          const updated = data.servers[0];
          setServers((prev) =>
            prev.map((s) => (s.address === address ? updated : s))
          );
        }
      }
    } catch (err) {
      console.error(`Failed to test ${address}:`, err);
    } finally {
      setTestingSingle(null);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("voyager_smithery_key", smitheryKey.trim());
    } catch {}
    handleTestAll();
  };

  const toggleTools = (address: string) => {
    setExpandedTools((prev) => ({ ...prev, [address]: !prev[address] }));
  };

  if (!isOpen) return null;

  const connectedCount = servers.filter((s) => s.status === "connected").length;
  const authCount = servers.filter((s) => s.status === "auth_required").length;
  const unreachableCount = servers.filter((s) => s.status === "unreachable").length;

  const filteredServers = servers.filter((s) => {
    if (filter === "connected" && s.status !== "connected") return false;
    if (filter === "auth" && s.status !== "auth_required") return false;
    if (filter === "error" && s.status !== "unreachable") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = s.label.toLowerCase().includes(q);
      const matchAddress = s.address.toLowerCase().includes(q);
      const matchDims = s.dims.some((d) => d.toLowerCase().includes(q));
      return matchLabel || matchAddress || matchDims;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  MCP Servers & Live Connectivity
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80">
                  {servers.length} Configured
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect real-time connection status, round-trip latency, and
                discovered tool definitions across all Model Context Protocol
                servers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Stats Banner */}
        <div className="p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 flex-1">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Total
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {servers.length}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                  Connected
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {connectedCount}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-center">
                <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                  Auth Req
                </div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {authCount}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-center">
                <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                  Offline
                </div>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {unreachableCount}
                </div>
              </div>
            </div>

            {/* Test All Button */}
            <button
              onClick={handleTestAll}
              disabled={isLoading}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>{isLoading ? "Probing Servers..." : "Test All Connections"}</span>
            </button>
          </div>

          {/* Optional Smithery Key Bar */}
          <form
            onSubmit={handleSaveKey}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs pt-1"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 shrink-0 font-medium">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Smithery Bearer Key:</span>
            </div>
            <input
              type="password"
              value={smitheryKey}
              onChange={(e) => setSmitheryKey(e.target.value)}
              placeholder="Optional Bearer token for Smithery endpoints"
              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-500/60"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors shrink-0"
            >
              Apply & Re-test
            </button>
          </form>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "all"
                  ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              All ({servers.length})
            </button>
            <button
              onClick={() => setFilter("connected")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "connected"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Connected ({connectedCount})
            </button>
            <button
              onClick={() => setFilter("auth")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "auth"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Auth Req ({authCount})
            </button>
            <button
              onClick={() => setFilter("error")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === "error"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Offline ({unreachableCount})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search server or dimension..."
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* Server List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 dark:bg-slate-950/20">
          {filteredServers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              No MCP servers match the selected filter.
            </div>
          ) : (
            filteredServers.map((server, idx) => {
              const isTestingThis = testingSingle === server.address;
              const hasTools = server.tools && server.tools.length > 0;
              const isOpenTools = expandedTools[server.address] ?? false;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Icon */}
                        {server.status === "connected" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Connected
                          </span>
                        )}
                        {server.status === "auth_required" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Auth Required (401)
                          </span>
                        )}
                        {server.status === "unreachable" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
                            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Offline
                          </span>
                        )}
                        {server.status === "configured" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Activity className="w-3 h-3 text-slate-500" />
                            Configured (Untested)
                          </span>
                        )}

                        <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {server.label}
                        </span>

                        {server.pingMs !== null && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            • {server.pingMs} ms
                          </span>
                        )}
                      </div>

                      {/* Endpoint URL */}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        <span className="truncate">{server.address}</span>
                        <a
                          href={server.address}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-600 dark:hover:text-cyan-400 p-0.5"
                          title="Open URL in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Mapped Dimensions */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">
                          Dims:
                        </span>
                        {server.dims.map((dim: TravelDimension) => (
                          <DimensionChip
                            key={dim}
                            dimension={dim}
                            status={server.status === "connected" ? "ok" : "no_data"}
                            size="sm"
                          />
                        ))}
                      </div>

                      {/* Error text if present */}
                      {server.error && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 pt-1 leading-tight font-mono">
                          {server.error}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Actions & Tools Toggle */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {hasTools && (
                        <button
                          onClick={() => toggleTools(server.address)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                        >
                          <Wrench className="w-3 h-3 text-cyan-500" />
                          <span>{server.tools.length} Tools</span>
                          {isOpenTools ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleTestSingle(server.address)}
                        disabled={isTestingThis || isLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${isTestingThis ? "animate-spin text-cyan-500" : ""}`}
                        />
                        <span>{isTestingThis ? "Testing..." : "Test"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Discovered Tools Drawer */}
                  {isOpenTools && hasTools && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                        Discovered MCP Tools ({server.tools.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {server.tools.map((t, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-0.5"
                          >
                            <div className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 text-[11px]">
                              {t.name}
                            </div>
                            {t.description && (
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                {t.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            {lastChecked
              ? `Last tested: ${new Date(lastChecked).toLocaleTimeString()}`
              : "Not tested yet"}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
