"use client";

import { Search, X } from "lucide-react";
import { useState, useCallback } from "react";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export default function SearchInput({
  placeholder = "Search teams, schools...",
  onSearch,
  className = "",
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-grey" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-light-grey border border-transparent rounded-lg text-smoke-black placeholder:text-neutral-grey focus:outline-none focus:border-smoke-black focus:bg-white transition-colors"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-grey/20 rounded-full transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-neutral-grey" />
        </button>
      )}
    </div>
  );
}
