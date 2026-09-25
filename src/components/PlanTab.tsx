import React, { useState } from "react";
import {
  Sparkles,
  Loader2,
  Calendar,
  Users,
  MapPin,
  Wallet,
  Globe,
  Sliders,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileQuestion,
} from "lucide-react";
import {
  TripContext,
  PlanResponse,
  DestinationPlan,
  TravelDimension,
} from "../types";
import { DimensionChip } from "./DimensionChip";
import { ToolCallsList } from "./ToolCallsList";
import { DIMENSIONS_META } from "../utils/dimensionInfo";

interface Props {
  context: TripContext;
  onUpdateContext: (ctx: Partial<TripContext>) => void;
  onAskAboutPlan: (destination: string) => void;
}

const ALL_DIMENSIONS: TravelDimension[] = [
  "budget",
  "destination",
  "cost_exchange",
  "flights",
  "stays",
  "places",
  "weather",
  "routes",
  "transport",
  "visa",
];

export const PlanTab: React.FC<Props> = ({
  context,
  onUpdateContext,
  onAskAboutPlan,
}) => {
  // Form State
  const [originCity, setOriginCity] = useState(context.origin_city || "Singapore");
  const [budget, setBudget] = useState<number | "">(context.budget || 2000);
  const [currency, setCurrency] = useState(context.currency || "SGD");
  const [startDate, setStartDate] = useState(
    context.start_date ||
      new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    context.end_date ||
      new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0]
  );
  const [travellers, setTravellers] = useState<number>(context.travellers || 1);
  const [nationality, setNationality] = useState(
    context.nationality || "Singaporean"
  );
  const [destination, setDestination] = useState(context.destination || "");
  const [preferences, setPreferences] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [expandedDims, setExpandedDims] = useState<Record<string, boolean>>({});

  const toggleDim = (key: string) => {
    setExpandedDims((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numBudget = Number(budget);
    if (!originCity.trim()) {
      setErrorMessage("Origin city is required.");
      return;
    }
    if (isNaN(numBudget) || numBudget <= 0) {
      setErrorMessage("Budget must be a positive number.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Start and end dates are required.");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setErrorMessage("End date must be after start date.");
      return;
    }
    const tripDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (tripDays > 30) {
      setErrorMessage("Trip duration must be at most 30 days.");
      return;
    }
    if (!nationality.trim()) {
      setErrorMessage("Nationality is required.");
      return;
    }

    // Sync context to parent
    onUpdateContext({
      origin_city: originCity.trim(),
      budget: numBudget,
      currency: currency.trim().toUpperCase(),
      start_date: startDate,
      end_date: endDate,
      travellers,
      nationality: nationality.trim(),
      destination: destination.trim() || undefined,
    });

    setIsLoading(true);

    try {
      const payload = {
        origin_city: originCity.trim(),
        budget: numBudget,
        currency: currency.trim().toUpperCase(),
        start_date: startDate,
        end_date: endDate,
        travellers,
        nationality: nationality.trim(),
        destination: destination.trim() || undefined,
        preferences: preferences.trim() || undefined,
      };

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: PlanResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Planning failed with status ${res.status}`);
      }

      setPlanResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate travel plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full 10-Dimension Itinerary Engine</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Plan Your Trip Across All Dimensions
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Provide your departure, budget, dates, and nationality. We query
              every MCP server in parallel to craft a verified, budget-checked
              itinerary.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Real-time FX conversions into your chosen currency with line-item
              reconciliation.
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left/Top, Results on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Planning Form */}
        <form
          onSubmit={handlePlanSubmit}
          className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl"
        >
          <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Trip Parameters</span>
          </div>

          {/* Origin City */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Origin City *</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              placeholder="e.g. Singapore, London, New York"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Budget & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Budget *</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={budget}
                onChange={(e) =>
                  setBudget(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="2000"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500/60"
              >
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="MYR">MYR</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Start Date *</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>End Date * (max 30d)</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Travellers & Nationality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Travellers (1-10)</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={travellers}
                onChange={(e) => setTravellers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-rose-400" />
                <span>Nationality (for Visa) *</span>
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. Singaporean"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Destination (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Destination (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Leave blank to shortlist up to 3
              </span>
            </div>
            <input
              type="text"
              maxLength={80}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Seoul, Bangkok (or blank)"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Preferences */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Preferences & Trip Style
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. Near train stations, quiet boutique stays, culinary highlights..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Orchestrating 10-Dimension Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Generate Verified Travel Plan</span>
              </>
            )}
          </button>
        </form>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {isLoading && (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin-slow" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  Querying All MCP Servers in Parallel
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Checking flight airfares, stays, currency rates, weather
                  forecasts, visa regulations, and summing line items to verify
                  affordability...
                </p>
              </div>
            </div>
          )}

          {!isLoading && !planResult && (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
              <Receipt className="w-10 h-10 text-slate-600" />
              <div className="text-sm font-medium text-slate-400">
                No Plan Generated Yet
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Fill in the trip parameters on the left and click "Generate
                Verified Travel Plan" to inspect destination fits, line items, and
                MCP tool execution logs.
              </p>
            </div>
          )}

          {!isLoading && planResult && (
            <div className="space-y-6">
              {/* Summary */}
              {planResult.plan?.summary && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed shadow-sm">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Plan Summary</span>
                  </div>
                  {planResult.plan.summary}
                </div>
              )}

              {/* Parse error warning if any */}
              {planResult.plan?.parse_error && (
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    The model output could not be strictly parsed as JSON;
                    displaying raw summary response.
                  </span>
                </div>
              )}

              {/* Destinations List */}
              {planResult.plan?.destinations?.map((dest: DestinationPlan, dIdx: number) => {
                const isWithinBudget = dest.fits_budget;
                const computedTotal = dest.computed_total ?? 0;
                const userBudget = Number(budget) || 1;
                const percentUsed = Math.min(
                  Math.round((computedTotal / userBudget) * 100),
                  200
                );

                return (
                  <div
                    key={dIdx}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl"
                  >
                    {/* Destination Card Header */}
                    <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-b from-slate-850 to-slate-900">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-bold text-white tracking-tight">
                            {dest.name}
                          </h2>

                          {/* Budget Status Badge */}
                          {isWithinBudget ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Within budget
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/80 text-amber-300 text-xs font-semibold">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              Over budget
                            </span>
                          )}

                          {dest.model_claim_fits_budget !== undefined &&
                            dest.model_claim_fits_budget !== dest.fits_budget && (
                              <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                                Model claimed{" "}
                                {dest.model_claim_fits_budget ? "within" : "over"}{" "}
                                budget
                              </span>
                            )}
                        </div>

                        {/* Computed total vs Budget */}
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>
                            Computed Total:{" "}
                            <strong className="text-white font-mono">
                              {computedTotal.toLocaleString()} {currency}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Budget:{" "}
                            <span className="text-slate-300 font-mono">
                              {Number(budget).toLocaleString()} {currency}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Ask about this plan button */}
                      <button
                        onClick={() => onAskAboutPlan(dest.name)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all shrink-0 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ask about this plan</span>
                      </button>
                    </div>

                    {/* Budget Usage Progress Bar */}
                    <div className="px-5 py-2.5 bg-slate-950/50 border-b border-slate-800/60 text-xs flex items-center gap-3">
                      <span className="text-slate-400 text-[11px] font-mono shrink-0">
                        {percentUsed}% budget
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isWithinBudget ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* 10 Collapsible Dimension Sections */}
                    <div className="p-5 space-y-2 border-b border-slate-800">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Ten Dimensions Breakdown
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_DIMENSIONS.map((dimKey) => {
                          const dimDetail = dest.dimensions?.[dimKey];
                          const meta = DIMENSIONS_META[dimKey];
                          const collapseKey = `${dIdx}-${dimKey}`;
                          const isOpen = expandedDims[collapseKey] ?? false;

                          const status = dimDetail?.status || "no_data";
                          const text = dimDetail?.text || "No specific data returned for this dimension.";

                          return (
                            <div
                              key={dimKey}
                              className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs transition-colors hover:border-slate-700"
                            >
                              <div
                                onClick={() => toggleDim(collapseKey)}
                                className="flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <DimensionChip
                                    dimension={dimKey}
                                    status={status}
                                    size="sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-white p-0.5"
                                >
                                  {isOpen ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {isOpen && (
                                <p className="mt-2 pt-2 border-t border-slate-800/80 text-slate-300 leading-relaxed text-[11px]">
                                  {text}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Line Items & Sources</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {dest.line_items?.length || 0} items
                        </span>
                      </div>

                      {dest.line_items && dest.line_items.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                              <tr>
                                <th className="px-3.5 py-2">Item</th>
                                <th className="px-3.5 py-2">Amount</th>
                                <th className="px-3.5 py-2">Source Tool</th>
                                <th className="px-3.5 py-2">Fetched At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-sans">
                              {dest.line_items.map((li, liIdx) => (
                                <tr
                                  key={liIdx}
                                  className="hover:bg-slate-800/40 transition-colors"
                                >
                                  <td className="px-3.5 py-2.5 font-medium text-slate-200">
                                    {li.item}
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono text-cyan-300 whitespace-nowrap">
                                    {Number(li.amount).toLocaleString()}{" "}
                                    {li.currency || currency}
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                                    {li.source || "MCP Tool"}
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                                    {li.fetched_at || "time not given"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-slate-500 italic text-xs py-2">
                          No itemized figures returned by tools.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Tool Calls & Unavailable Servers Under Results */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Remote MCP Calls During Planning
                </div>
                <ToolCallsList
                  toolCalls={planResult.tool_calls}
                  unavailable={planResult.unavailable}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
