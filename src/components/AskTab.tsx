import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Server,
  HelpCircle,
  AlertCircle,
  MapPin,
  Compass,
  ArrowRight,
} from "lucide-react";
import {
  ChatMessage,
  TripContext,
  AskResponse,
  ChatTurn,
  TravelDimension,
} from "../types";
import { DimensionChip } from "./DimensionChip";
import { ToolCallsList } from "./ToolCallsList";

interface Props {
  context: TripContext;
  onClearContext?: () => void;
  onSwitchToPlan?: () => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isBusy: boolean;
  setIsBusy: React.Dispatch<React.SetStateAction<boolean>>;
}

const EXAMPLE_QUESTIONS = [
  {
    dim: "visa" as TravelDimension,
    label: "Visa Rules",
    text: "Do Singaporeans need a visa for Japan?",
  },
  {
    dim: "weather" as TravelDimension,
    label: "Weather",
    text: "Weather in Seoul next week?",
  },
  {
    dim: "flights" as TravelDimension,
    label: "Flights & Transit",
    text: "Cheapest way from Narita to Shinjuku?",
  },
  {
    dim: "budget" as TravelDimension,
    label: "Budget",
    text: "Is 1,200 SGD sufficient for a 5-day trip to Tokyo?",
  },
];

export const AskTab: React.FC<Props> = ({
  context,
  messages,
  setMessages,
  isBusy,
  setIsBusy,
}) => {
  const [inputQuestion, setInputQuestion] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBusy]);

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || isBusy) return;

    setErrorMessage(null);
    setInputQuestion("");

    // Create user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsBusy(true);

    try {
      // Build last 6 turns as history
      const historyTurns: ChatTurn[] = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // Filter context to only non-empty values
      const cleanContext: TripContext = {};
      if (context.origin_city) cleanContext.origin_city = context.origin_city;
      if (context.budget && context.budget > 0) cleanContext.budget = context.budget;
      if (context.currency) cleanContext.currency = context.currency;
      if (context.start_date) cleanContext.start_date = context.start_date;
      if (context.end_date) cleanContext.end_date = context.end_date;
      if (context.travellers) cleanContext.travellers = context.travellers;
      if (context.nationality) cleanContext.nationality = context.nationality;
      if (context.destination) cleanContext.destination = context.destination;

      const payload = {
        question: q,
        context: Object.keys(cleanContext).length > 0 ? cleanContext : undefined,
        history: historyTurns.length > 0 ? historyTurns : undefined,
      };

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: AskResponse & { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }

      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        text: data.answer || "No response received.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        needs_clarification: data.needs_clarification,
        routed_to: data.routed_to || [],
        servers_used: data.servers_used || [],
        not_covered: data.not_covered || [],
        routing_fallback: data.routing_fallback,
        tool_calls: data.tool_calls || [],
        unavailable: data.unavailable || [],
        model: data.model,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to contact travel agent.");
    } finally {
      setIsBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContext = Boolean(
    context.destination || context.origin_city || context.budget
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 py-4">
      {/* Context banner if context is active */}
      {hasContext && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              <strong>Active Trip Context:</strong>{" "}
              {context.origin_city ? `From ${context.origin_city}` : ""}{" "}
              {context.destination ? `To ${context.destination}` : ""}{" "}
              {context.budget
                ? `(Budget: ${context.budget} ${context.currency || "SGD"})`
                : ""}
            </span>
          </div>
          <span className="text-[11px] text-cyan-400/80 font-mono">
            Linked from Plan tab
          </span>
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/5">
              <Compass className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-bold text-white">
                What travel questions can I answer for you?
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Type in natural language. Our agent routes your question across
                specialized MCP servers for live flight routes, visa rules,
                weather, hotel stays, and currency conversions.
              </p>
            </div>

            {/* 4 Example Question Chips */}
            <div className="w-full max-w-lg space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                Suggested questions:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {EXAMPLE_QUESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.text)}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <DimensionChip dimension={item.dim} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                      "{item.text}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-3xl space-y-2 ${isUser ? "items-end" : "items-start"}`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-cyan-500 text-slate-950 font-medium rounded-br-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {/* If clarifying question, show notice */}
                    {msg.needs_clarification && (
                      <div className="mb-2 pb-2 border-b border-amber-500/20 text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Clarification Needed:</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {/* Under each model answer: Routing metadata & Tool calls list */}
                  {!isUser && (
                    <div className="w-full space-y-2">
                      {/* Routed To & Server Labels */}
                      {((msg.routed_to && msg.routed_to.length > 0) ||
                        (msg.servers_used && msg.servers_used.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Routed to:
                          </span>

                          {/* Dimension chips */}
                          {msg.routed_to?.map((dim) => (
                            <DimensionChip key={dim} dimension={dim} size="sm" />
                          ))}

                          {/* Server labels */}
                          {msg.servers_used?.map((srv) => (
                            <span
                              key={srv}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700"
                            >
                              <Server className="w-2.5 h-2.5 text-cyan-400" />
                              {srv}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tool Calls Inspector */}
                      <ToolCallsList
                        toolCalls={msg.tool_calls}
                        unavailable={msg.unavailable}
                        notCovered={msg.not_covered}
                        routingFallback={msg.routing_fallback}
                      />
                    </div>
                  )}

                  {/* Timestamp & info */}
                  <div
                    className={`text-[10px] text-slate-500 px-1 font-mono ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {msg.timestamp}{" "}
                    {msg.model && !isUser ? `• ${msg.model}` : ""}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isBusy && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="rounded-2xl rounded-bl-none px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>
                Routing question to relevant MCP dimensions & executing tools...
              </span>
            </div>
          </div>
        )}

        {/* Error notice */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Query Execution Error</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="pt-3">
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-lg p-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask any travel question (e.g. 'Do Singaporeans need a visa for Japan?', 'Cheapest way from Narita to Shinjuku?')..."
            maxLength={500}
            disabled={isBusy}
            className="w-full bg-transparent px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none resize-none font-sans"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800/60">
            <div className="text-[11px] text-slate-500 font-mono">
              {inputQuestion.length}/500 chars • Enter to send • Shift+Enter for newline
            </div>

            <button
              onClick={() => handleSend()}
              disabled={isBusy || !inputQuestion.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-500/20"
            >
              {isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
