import { useState } from "react";
import { Header } from "./components/Header";
import { AskTab } from "./components/AskTab";
import { PlanTab } from "./components/PlanTab";
import { ArchitectureModal } from "./components/ArchitectureModal";
import { TripContext, ChatMessage } from "./types";

export default function App() {
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

  const handleUpdateContext = (newCtx: Partial<TripContext>) => {
    setContext((prev) => ({ ...prev, ...newCtx }));
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleAskAboutPlan = (destName: string) => {
    setContext((prev) => ({ ...prev, destination: destName }));
    setActiveTab("ask");

    // Add quick introductory context prompt to chat
    const initialQuestion = `What are the top recommended places, transit options, and weather details for my planned trip to ${destName}?`;
    // We can populate or let user immediately ask
    // Add a helper turn or message to prompt the user
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        context={context}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onNewChat={handleNewChat}
        isAskBusy={isAskBusy}
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
    </div>
  );
}
