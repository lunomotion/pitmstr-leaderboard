"use client";

import type { Division } from "@/lib/types";

interface DivisionFilterProps {
  selectedDivision: Division | "all";
  onDivisionChange: (division: Division | "all") => void;
}

export default function DivisionFilter({
  selectedDivision,
  onDivisionChange,
}: DivisionFilterProps) {
  const divisions: { value: Division | "all"; label: string }[] = [
    { value: "all", label: "All Divisions" },
    { value: "HSBBQ", label: "High School" },
    { value: "MSBBQ", label: "Middle School" },
  ];

  return (
    <div className="flex gap-2">
      {divisions.map((division) => (
        <button
          key={division.value}
          onClick={() => onDivisionChange(division.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            selectedDivision === division.value
              ? "bg-smoke-black text-white"
              : "bg-light-grey text-smoke-black hover:bg-neutral-grey/30"
          }`}
        >
          {division.label}
        </button>
      ))}
    </div>
  );
}
