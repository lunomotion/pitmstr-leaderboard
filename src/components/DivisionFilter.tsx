"use client";

import { useEffect, useState } from "react";
import type { Division } from "@/lib/types";

interface DivisionFilterProps {
  selectedDivision: Division | "all";
  onDivisionChange: (division: Division | "all") => void;
}

interface DivisionRecord {
  id: string;
  name: string;
  code: string;
}

export default function DivisionFilter({
  selectedDivision,
  onDivisionChange,
}: DivisionFilterProps) {
  const [divisions, setDivisions] = useState<DivisionRecord[]>([]);

  useEffect(() => {
    async function fetchDivisions() {
      try {
        const res = await fetch("/api/admin/lookups?table=divisions");
        const json = await res.json();
        if (json.success && json.data) {
          setDivisions(json.data);
        }
      } catch {
        // silent — buttons just won't show
      }
    }
    fetchDivisions();
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onDivisionChange("all")}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
          selectedDivision === "all"
            ? "bg-smoke-black text-white"
            : "bg-light-grey text-smoke-black hover:bg-neutral-grey/30"
        }`}
      >
        All Divisions
      </button>
      {divisions.map((d) => (
        <button
          key={d.id}
          onClick={() => onDivisionChange(d.name)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            selectedDivision === d.name
              ? "bg-smoke-black text-white"
              : "bg-light-grey text-smoke-black hover:bg-neutral-grey/30"
          }`}
        >
          {d.name || d.code}
        </button>
      ))}
    </div>
  );
}
