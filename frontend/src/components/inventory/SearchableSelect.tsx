import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface SearchableSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

export const SearchableSelect = ({ value, onValueChange, options, placeholder = "Select...", allLabel = "All", className = "" }: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const displayValue = value === "all" ? allLabel : value;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-8 px-2.5 text-xs border border-input bg-background rounded-sm hover:bg-accent/50 transition-colors"
      >
        <span className="truncate text-foreground">{displayValue}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] bg-popover border border-border rounded-sm shadow-md">
          <div className="p-1.5 border-b border-border">
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-7 pl-7 pr-2 text-xs bg-background border border-input rounded-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => { onValueChange("all"); setOpen(false); setSearch(""); }}
              className={`w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent ${value === "all" ? "bg-accent font-medium" : ""}`}
            >
              {allLabel}
            </button>
            {filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onValueChange(opt); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent ${value === opt ? "bg-accent font-medium" : ""}`}
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1.5">No results</p>}
          </div>
        </div>
      )}
    </div>
  );
};
