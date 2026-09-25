import { useState } from "react";
import { Header } from "./components/Header";
import { AskTab } from "./components/AskTab";
import { PlanTab } from "./components/PlanTab";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { McpStatusModal } from "./components/McpStatusModal";
import { ThemeProvider } from "./context/ThemeContext";
import { TripContext, ChatMessage } from "./types";

function MainContent() {
  const [activeTab, setActiveTab] = useState<"ask" | "plan">("ask");
  const [context, setContext] = useState<TripContext>({
    origin_city: "Singapore",
    budget: 2000,
    currency: "SGD",
    start_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    end_date: new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0],
    travellers: 1,
    nationality: "Singaporean",
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAskBusy, setIsAskBusy] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [mcpConnectedCount, setMcpConnectedCount] = useState(0);
  const [mcpTotalCount, setMcpTotalCount] = useState(11);

  const handleUpdateContext = (newCtx: Partial<TripContext>) => {
    setContext((prev) => ({ ...prev, ...newCtx }));
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleAskAboutPlan = (destName: string) => {
    setContext((prev) => ({ ...prev, destination: destName }));
    setActiveTab("ask");

    const noticeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "model",
      text: `Destination "${destName}" is now active in your trip context. You can ask anything about transit, weather, entry requirements, or budget allocation for this destination.`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      routed_to: ["destination", "budget"],
    };
    setMessages((prev) => [...prev, noticeMsg]);
  };

  const handleServerStatusUpdate = (connected: number, total: number) => {
    setMcpConnectedCount(connected);
    setMcpTotalCount(total);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        context={context}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenMcpStatus={() => setIsMcpModalOpen(true)}
        onNewChat={handleNewChat}
        isAskBusy={isAskBusy}
        mcpConnectedCount={mcpConnectedCount}
        mcpTotalCount={mcpTotalCount}
      />

      <main className="flex-1 w-full">
        {activeTab === "ask" ? (
          <AskTab
            context={context}
            messages={messages}
            setMessages={setMessages}
            isBusy={isAskBusy}
            setIsBusy={setIsAskBusy}
            onSwitchToPlan={() => setActiveTab("plan")}
          />
        ) : (
          <PlanTab
            context={context}
            onUpdateContext={handleUpdateContext}
            onAskAboutPlan={handleAskAboutPlan}
          />
        )}
      </main>

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <McpStatusModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
        onServerStatusUpdate={handleServerStatusUpdate}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
}
