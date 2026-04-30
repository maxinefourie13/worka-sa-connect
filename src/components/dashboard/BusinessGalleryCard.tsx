import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { compressIfImage } from "@/lib/compressImage";

interface GalleryImage {
  id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
}

const MAX_IMAGES = 12;

export function BusinessGalleryCard({ businessId }: { businessId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("business_images")
      .select("id, url, storage_path, sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true });
    setImages((data ?? []) as GalleryImage[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast({ title: "Gallery's full, boet.", description: `Max ${MAX_IMAGES} photos. Remove one first.`, variant: "destructive" });
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    let nextOrder = images.length;
    for (const raw of toUpload) {
      try {
        const file = await compressIfImage(raw);
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("business-gallery")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("business-gallery").getPublicUrl(path);
        const { error: insErr } = await supabase.from("business_images").insert({
          business_id: businessId,
          url: pub.publicUrl,
          storage_path: path,
          sort_order: nextOrder++,
        });
        if (insErr) throw insErr;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast({ title: "Aikona, photo didn't upload.", description: msg, variant: "destructive" });
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await load();
    toast({ title: "Sharp! Photos added.", description: "They're live on your profile." });
  };

  const remove = async (img: GalleryImage) => {
    if (!confirm("Remove this photo from your gallery?")) return;
    if (img.storage_path) {
      await supabase.storage.from("business-gallery").remove([img.storage_path]);
    }
    await supabase.from("business_images").delete().eq("id", img.id);
    await load();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-tight">Photo gallery</h2>
          <p className="text-sm text-ink-2 mt-0.5">
            Show your work — installs, finished jobs, the team. Up to {MAX_IMAGES} photos.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
        >
          <Plus className="size-4" />
          {uploading ? "Uploading…" : "Add photos"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : images.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <ImagePlus className="size-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Add your first photo</p>
          <p className="text-xs text-muted-foreground mt-1">JPG or PNG, up to 2MB each (we'll compress them).</p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img src={img.url} alt="Gallery" className="size-full object-cover" loading="lazy" />
              <button
                type="button"
                onClick={() => remove(img)}
                className="absolute top-2 right-2 size-7 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                aria-label="Remove photo"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
