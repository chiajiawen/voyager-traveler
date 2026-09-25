import {
  Wallet,
  Compass,
  ArrowLeftRight,
  Plane,
  Building,
  MapPin,
  CloudSun,
  Milestone,
  Train,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";
import { TravelDimension } from "../types";

export interface DimensionMeta {
  key: TravelDimension;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
}

export const DIMENSIONS_META: Record<TravelDimension, DimensionMeta> = {
  budget: {
    key: "budget",
    label: "Budget Evaluation",
    shortLabel: "Budget",
    icon: Wallet,
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    description: "Expense tracking, limits & affordability calculation",
  },
  destination: {
    key: "destination",
    label: "Destination Highlights",
    shortLabel: "Destination",
    icon: Compass,
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-400",
    borderColor: "border-blue-500/30",
    description: "City profiles, regional guides & travel suitability",
  },
  cost_exchange: {
    key: "cost_exchange",
    label: "Exchange & Rates",
    shortLabel: "Exchange",
    icon: ArrowLeftRight,
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/30",
    description: "Real-time foreign exchange and currency conversion",
  },
  flights: {
    key: "flights",
    label: "Flights & Airfare",
    shortLabel: "Flights",
    icon: Plane,
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-400",
    borderColor: "border-sky-500/30",
    description: "Flight connections, fares, airlines & duration",
  },
  stays: {
    key: "stays",
    label: "Stays & Lodging",
    shortLabel: "Stays",
    icon: Building,
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    description: "Hotels, resorts, apartments & nightly rates",
  },
  places: {
    key: "places",
    label: "Places & Sights",
    shortLabel: "Places",
    icon: MapPin,
    badgeBg: "bg-fuchsia-500/15",
    badgeText: "text-fuchsia-400",
    borderColor: "border-fuchsia-500/30",
    description: "Landmarks, cultural sites, tickets & opening hours",
  },
  weather: {
    key: "weather",
    label: "Weather Forecast",
    shortLabel: "Weather",
    icon: CloudSun,
    badgeBg: "bg-teal-500/15",
    badgeText: "text-teal-400",
    borderColor: "border-teal-500/30",
    description: "Seasonal forecasts, temperature & precipitation",
  },
  routes: {
    key: "routes",
    label: "Routes & Itinerary",
    shortLabel: "Routes",
    icon: Milestone,
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-400",
    borderColor: "border-violet-500/30",
    description: "Daily routing order, transfers & travel geometry",
  },
  transport: {
    key: "transport",
    label: "Ground Transport",
    shortLabel: "Transport",
    icon: Train,
    badgeBg: "bg-orange-500/15",
    badgeText: "text-orange-400",
    borderColor: "border-orange-500/30",
    description: "Trains, subways, express buses & airport links",
  },
  visa: {
    key: "visa",
    label: "Visa & Entry Rules",
    shortLabel: "Visa",
    icon: ShieldCheck,
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-400",
    borderColor: "border-rose-500/30",
    description: "Passports, entry requirements, e-visas & limits",
  },
};
