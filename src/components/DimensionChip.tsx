import React from "react";
import { TravelDimension } from "../types";
import { DIMENSIONS_META } from "../utils/dimensionInfo";

interface Props {
  dimension: TravelDimension;
  status?: "ok" | "no_data" | "error";
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const DimensionChip: React.FC<Props> = ({
  dimension,
  status,
  size = "md",
  showIcon = true,
}) => {
  const meta = DIMENSIONS_META[dimension] || {
    key: dimension,
    label: dimension,
    shortLabel: dimension,
    badgeBg: "bg-slate-800",
    badgeText: "text-slate-300",
    borderColor: "border-slate-700",
  };

  const Icon = meta.icon;

  const statusStyles = {
    ok: "ring-1 ring-emerald-500/50 bg-emerald-950/40 text-emerald-300 border-emerald-500/40",
    no_data: "ring-1 ring-slate-600/40 bg-slate-900/60 text-slate-400 border-slate-700",
    error: "ring-1 ring-rose-500/50 bg-rose-950/40 text-rose-300 border-rose-500/40",
  };

  const isStatusDefined = status && statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-all ${
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"
      } ${
        isStatusDefined
          ? statusStyles[status]
          : `${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`
      }`}
      title={meta.description || meta.label}
    >
      {showIcon && Icon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{meta.shortLabel || dimension}</span>
      {status && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === "ok"
              ? "bg-emerald-400"
              : status === "no_data"
              ? "bg-slate-400"
              : "bg-rose-400 animate-pulse"
          }`}
        />
      )}
    </span>
  );
};
