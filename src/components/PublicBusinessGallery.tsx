import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  url: string;
}

/**
 * Public, read-only gallery rendered on a business's profile page.
 * Renders nothing if the business has no gallery images yet.
 */
export function PublicBusinessGallery({ businessId }: { businessId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("business_images")
        .select("id, url")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true });
      if (!cancelled) setImages((data ?? []) as GalleryImage[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (images.length === 0) return null;

  return (
    <>
      <h2 className="font-display text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Gallery</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpen(img.url)}
            className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
          >
            <img src={img.url} alt="Portfolio" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
          {open && <img src={open} alt="Gallery" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
