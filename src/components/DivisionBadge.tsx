import type { Division } from "@/lib/types";

interface DivisionBadgeProps {
  division: Division;
  size?: "sm" | "md";
}

export default function DivisionBadge({
  division,
  size = "sm",
}: DivisionBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const divisionConfig: Record<string, { label: string; fullLabel: string; className: string }> = {
    "Kids Que": {
      label: "KIDS QUE",
      fullLabel: "Kids Que",
      className: "bg-amber-500 text-white",
    },
    "Middle School BBQ": {
      label: "MSBBQ",
      fullLabel: "Middle School BBQ",
      className: "bg-brisket-brown text-white",
    },
    "High School BBQ": {
      label: "HSBBQ",
      fullLabel: "High School BBQ",
      className: "bg-americana-blue text-white",
    },
    "Inclusive BBQ": {
      label: "IBBQ",
      fullLabel: "Inclusive BBQ",
      className: "bg-purple-600 text-white",
    },
    "Collegiate BBQ": {
      label: "CBBQ",
      fullLabel: "Collegiate BBQ",
      className: "bg-emerald-600 text-white",
    },
    "Open BBQ": {
      label: "OPEN",
      fullLabel: "Open BBQ",
      className: "bg-slate-700 text-white",
    },
    "Mentor BBQ": {
      label: "MENTOR",
      fullLabel: "Mentor BBQ",
      className: "bg-sky-600 text-white",
    },
    // Legacy values for backward compat with old Airtable data
    HSBBQ: {
      label: "HSBBQ",
      fullLabel: "High School BBQ",
      className: "bg-americana-blue text-white",
    },
    MSBBQ: {
      label: "MSBBQ",
      fullLabel: "Middle School BBQ",
      className: "bg-brisket-brown text-white",
    },
  };

  // Default config for unknown divisions
  const defaultConfig = {
    label: division || "BBQ",
    fullLabel: division || "BBQ Division",
    className: "bg-neutral-grey text-smoke-black",
  };

  const config = divisionConfig[division] || defaultConfig;

  return (
    <span
      className={`inline-flex items-center rounded font-semibold uppercase tracking-wide ${config.className} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
