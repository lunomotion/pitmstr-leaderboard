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
    { value: "Kids Que", label: "Kids Que" },
    { value: "Middle School BBQ", label: "MSBBQ" },
    { value: "High School BBQ", label: "HSBBQ" },
    { value: "Inclusive BBQ", label: "IBBQ" },
    { value: "Collegiate BBQ", label: "CBBQ" },
    { value: "Open BBQ", label: "Open" },
    { value: "Mentor BBQ", label: "Mentor" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {divisions.map((division) => (
        <button
          key={division.value}
          onClick={() => onDivisionChange(division.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
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
