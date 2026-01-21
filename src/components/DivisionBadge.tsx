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
    HSBBQ: {
      label: "HSBBQ",
      fullLabel: "High School",
      className: "bg-americana-blue text-white",
    },
    MSBBQ: {
      label: "MSBBQ",
      fullLabel: "Middle School",
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
