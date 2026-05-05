import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  name?: string;
}

interface Suggestion {
  display_name: string;
  label: string;
}

function toLabel(display: string): string {
  const parts = display.split(",").map((p) => p.trim());
  // Return first 2 meaningful parts (suburb + city, or city + province)
  return parts.slice(0, 2).join(", ");
}

export function CityAutocomplete({ value, onChange, required, name }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=za&limit=6&format=json&addressdetails=0`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        const items: Suggestion[] = (data as { display_name: string }[]).map((r) => ({
          display_name: r.display_name,
          label: toLabel(r.display_name),
        }));
        // Deduplicate by label
        const seen = new Set<string>();
        const unique = items.filter((i) => { if (seen.has(i.label)) return false; seen.add(i.label); return true; });
        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        required={required}
        name={name}
        className="input"
        placeholder="e.g. Sandton"
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); search(e.target.value); }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-2">...</span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-muted truncate"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.label);
                setOpen(false);
                setSuggestions([]);
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
