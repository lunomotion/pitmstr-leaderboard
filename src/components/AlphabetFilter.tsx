"use client";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AlphabetFilterProps {
  activeLetter: string | null;
  onSelect: (letter: string | null) => void;
  className?: string;
}

export default function AlphabetFilter({
  activeLetter,
  onSelect,
  className = "",
}: AlphabetFilterProps) {
  return (
    <div
      className={`flex gap-1 overflow-x-auto pb-2 scrollbar-hide ${className}`}
    >
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
          activeLetter === null
            ? "bg-[#C62828] text-white"
            : "bg-transparent text-medium-grey hover:text-smoke-black hover:bg-light-grey"
        }`}
      >
        All
      </button>
      {LETTERS.map((letter) => (
        <button
          key={letter}
          onClick={() => onSelect(letter)}
          className={`flex-shrink-0 w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
            activeLetter === letter
              ? "bg-[#C62828] text-white"
              : "bg-transparent text-medium-grey hover:text-smoke-black hover:bg-light-grey"
          }`}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
