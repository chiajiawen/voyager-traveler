export type TravelDimension =
  | "budget"
  | "destination"
  | "cost_exchange"
  | "flights"
  | "stays"
  | "places"
  | "weather"
  | "routes"
  | "transport"
  | "visa";

export interface TripContext {
  origin_city?: string;
  budget?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  travellers?: number;
  nationality?: string;
  destination?: string;
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface ToolCallItem {
  name: string;
  args: Record<string, unknown>;
  label?: string;
  server?: string;
  failed?: boolean;
}

export interface UnavailableServer {
  label: string;
  address: string;
  reason: string;
}

export interface AskResponse {
  answer: string;
  needs_clarification?: boolean;
  routed_to: TravelDimension[];
  servers_used?: string[];
  not_covered?: TravelDimension[];
  routing_fallback?: boolean;
  tool_calls: ToolCallItem[];
  unavailable?: UnavailableServer[];
  model?: string;
  answered_at?: string;
  error?: string;
}

export interface DimensionDetail {
  text: string;
  status: "ok" | "no_data" | "error";
}

export interface LineItem {
  item: string;
  amount: number;
  currency: string;
  source: string;
  fetched_at: string;
}

export interface DestinationPlan {
  name: string;
  fits_budget: boolean;
  model_claim_fits_budget?: boolean;
  computed_total?: number;
  dimensions: Partial<Record<TravelDimension, DimensionDetail>>;
  line_items: LineItem[];
}

export interface PlanData {
  destinations: DestinationPlan[];
  summary: string;
  parse_error?: boolean;
}

export interface PlanResponse {
  plan: PlanData;
  tool_calls: ToolCallItem[];
  unavailable: UnavailableServer[];
  model?: string;
  answered_at?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  needs_clarification?: boolean;
  routed_to?: TravelDimension[];
  servers_used?: string[];
  not_covered?: TravelDimension[];
  routing_fallback?: boolean;
  tool_calls?: ToolCallItem[];
  unavailable?: UnavailableServer[];
  model?: string;
}
