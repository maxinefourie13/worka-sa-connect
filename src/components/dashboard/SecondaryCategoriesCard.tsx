import { useEffect, useMemo, useState } from "react";
import { Layers, Loader2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const MAX_SECONDARY = 6;

type Props = {
  businessId: string;
  primaryCategorySlug: string;
};

export const SecondaryCategoriesCard = ({ businessId, primaryCategorySlug }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("businesses")
        .select("secondary_categories")
        .eq("id", businessId)
        .maybeSingle();
      if (data?.secondary_categories) {
        setSelected((data.secondary_categories as string[]) ?? []);
      }
      setLoading(false);
    })();
  }, [businessId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATEGORIES.filter(
      (c) =>
        c.slug !== primaryCategorySlug &&
        (q === "" || c.name.toLowerCase().includes(q)),
    );
  }, [search, primaryCategorySlug]);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_SECONDARY) {
        toast({
          title: `Max ${MAX_SECONDARY} secondary categories`,
          description: "Drop one to add another.",
          variant: "destructive",
        });
        return prev;
      }
      return [...prev, slug];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("set_secondary_categories", {
      _business_id: businessId,
      _slugs: selected,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Sharp! Categories updated.",
      description: "You'll start showing up in these feeds too.",
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
      <div className="flex items-start gap-4 mb-5">
        <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Layers className="size-6 text-accent" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-xl tracking-tight">
            Secondary categories
          </h3>
          <p className="text-sm text-ink-2 mt-1 leading-relaxed">
            Pick up to <strong>{MAX_SECONDARY}</strong> extra categories so you stay in the feed
            year-round — not just in your busy season. Painters who do waterproofing in winter,
            this is for you.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <span className="text-sm font-semibold">
              {selected.length} / {MAX_SECONDARY} selected
            </span>
            <div className="relative w-full sm:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-border p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map((c) => {
              const isSelected = selected.includes(c.slug);
              const atMax = !isSelected && selected.length >= MAX_SECONDARY;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggle(c.slug)}
                  disabled={atMax}
                  className={cn(
                    "text-left text-sm rounded-lg border px-3 py-2 transition-all flex items-center gap-2",
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground font-semibold"
                      : "border-border hover:border-primary/40",
                    atMax && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <span className="text-base shrink-0">{c.emoji}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  {isSelected && <Check className="size-4 text-primary shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                No categories match "{search}".
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save categories
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
