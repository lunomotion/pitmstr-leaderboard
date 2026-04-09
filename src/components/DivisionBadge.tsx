import type { Division } from "@/lib/types";

interface DivisionBadgeProps {
  division: Division;
  size?: "sm" | "md";
}

// Known division styles — any division not listed here gets a neutral default
const DIVISION_STYLES: Record<string, string> = {
  // Current NHSBBQA division naming
  "KIDSQ Division": "bg-amber-500 text-white",
  "MSBBQ Division": "bg-brisket-brown text-white",
  "HSBBQ Division": "bg-americana-blue text-white",
  "HSBBQ Unified Division": "bg-purple-600 text-white",
  "CBBQ Division": "bg-emerald-600 text-white",
  "OBBQ Division": "bg-slate-700 text-white",
  "Mentor BBQ": "bg-sky-600 text-white",
  // Legacy values from old Airtable data — kept for backward compatibility
  "Kids Que": "bg-amber-500 text-white",
  "Middle School BBQ": "bg-brisket-brown text-white",
  "High School BBQ": "bg-americana-blue text-white",
  "Inclusive BBQ": "bg-purple-600 text-white",
  "Collegiate BBQ": "bg-emerald-600 text-white",
  "Open BBQ": "bg-slate-700 text-white",
  HSBBQ: "bg-americana-blue text-white",
  MSBBQ: "bg-brisket-brown text-white",
};

export default function DivisionBadge({
  division,
  size = "sm",
}: DivisionBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const className = DIVISION_STYLES[division] || "bg-neutral-grey text-smoke-black";
  const label = division || "BBQ";

  return (
    <span
      className={`inline-flex items-center rounded font-semibold uppercase tracking-wide ${className} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  );
}
