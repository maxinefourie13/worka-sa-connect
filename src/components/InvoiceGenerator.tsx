import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Plus, Trash2, Download, MessageCircle, Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  computeInvoiceTotals,
  generateInvoicePdf,
  fileToDataUrl,
  type InvoiceLineItem,
} from "@/lib/invoice";

type Props = {
  dealMemoId: string;
  businessId: string;
  proUserId: string;
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  defaultAmount?: number;
  defaultDescription?: string;
};

const buildWhatsAppShare = (phone: string | null | undefined, message: string) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "27" + digits.slice(1);
  if (!digits.startsWith("27")) digits = "27" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export const InvoiceGenerator = ({
  dealMemoId,
  businessId,
  proUserId,
  customer,
  defaultAmount,
  defaultDescription,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { description: defaultDescription ?? "Service rendered", qty: 1, unit_price: defaultAmount ?? 0 },
  ]);
  const [vatIncluded, setVatIncluded] = useState(false);
  const [notes, setNotes] = useState<string>("Payment via EFT or cash on completion. Thank you.");
  const [business, setBusiness] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string | null>(null);

  // Logo state
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || business) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("name, email, phone, address, city, province, logo_url")
        .eq("id", businessId)
        .maybeSingle();
      if (data) {
        setBusiness(data);
        // If business already has a stored logo URL, pre-load it as a data URL
        if (data.logo_url) {
          try {
            const res = await fetch(data.logo_url);
            const blob = await res.blob();
            const file = new File([blob], "logo", { type: blob.type });
            const dataUrl = await fileToDataUrl(file);
            setLogoDataUrl(dataUrl);
            setLogoPreview(data.logo_url);
          } catch {
            // Non-critical — just won't pre-populate
          }
        }
      }
    })();
  }, [open, business, businessId]);

  const totals = useMemo(() => computeInvoiceTotals(items, vatIncluded), [items, vatIncluded]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      toast({ title: "Logo too large", description: "Max size is 2 MB. Try a smaller image.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Not an image", description: "Please upload a PNG or JPEG.", variant: "destructive" });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoDataUrl(dataUrl);
      setLogoPreview(dataUrl);
    } catch {
      toast({ title: "Couldn't read logo", variant: "destructive" });
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeLogo = () => {
    setLogoDataUrl(null);
    setLogoPreview(null);
  };

  const updateItem = (idx: number, patch: Partial<InvoiceLineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () =>
    setItems((prev) => [...prev, { description: "", qty: 1, unit_price: 0 }]);

  const removeItem = (idx: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const buildAndSave = async (): Promise<{ invoiceNumber: string; pdfBlob: Blob } | null> => {
    if (!business) {
      toast({ title: "Loading your business details…", variant: "destructive" });
      return null;
    }
    if (items.some((i) => !i.description.trim())) {
      toast({ title: "Each line needs a description", variant: "destructive" });
      return null;
    }
    if (totals.total <= 0) {
      toast({ title: "Total must be greater than R0", variant: "destructive" });
      return null;
    }

    setBusy(true);

    const now = new Date();
    const ymd =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = savedInvoiceNumber ?? `SJ-${ymd}-${suffix}`;

    if (!savedInvoiceNumber) {
      const { error } = await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        pro_user_id: proUserId,
        business_id: businessId,
        deal_memo_id: dealMemoId,
        customer_name: customer.name,
        customer_email: customer.email ?? null,
        customer_phone: customer.phone ?? null,
        line_items: items as any,
        subtotal_zar: totals.subtotal,
        vat_zar: totals.vat,
        total_zar: totals.total,
        vat_included: vatIncluded,
        notes,
      });
      if (error) {
        setBusy(false);
        toast({ title: "Couldn't save invoice", description: error.message, variant: "destructive" });
        return null;
      }
      setSavedInvoiceNumber(invoiceNumber);
    }

    const doc = generateInvoicePdf({
      invoice_number: invoiceNumber,
      issued_at: now,
      business: {
        name: business.name,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        province: business.province,
        logo_data_url: logoDataUrl,
      },
      customer,
      line_items: items,
      vat_included: vatIncluded,
      notes,
    });

    const pdfBlob = doc.output("blob");
    setBusy(false);
    return { invoiceNumber, pdfBlob };
  };

  const handleDownload = async () => {
    const result = await buildAndSave();
    if (!result) return;
    const url = URL.createObjectURL(result.pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Invoice downloaded", description: "Sharp! Send it to your customer on WhatsApp." });
  };

  const handleWhatsApp = async () => {
    const result = await buildAndSave();
    if (!result) return;
    const url = URL.createObjectURL(result.pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const msg = `Hi ${customer.name}, here's your Sjoh invoice ${result.invoiceNumber} for R${totals.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}. I've attached the PDF — let me know if anything needs changing.`;
    const link = buildWhatsAppShare(customer.phone, msg);
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      toast({ title: "PDF saved", description: "No customer phone on file — share the PDF manually." });
    }
  };

  if (!open) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Generate a Sjoh invoice</h3>
              <p className="text-sm text-ink-2 mt-1">
                Send your customer a professional, branded PDF invoice — with your logo on it.
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}>Create invoice</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-primary" />
        <h3 className="font-display font-bold text-lg">New Sjoh invoice</h3>
      </div>

      {/* Logo upload */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Your logo (optional)
        </Label>
        <p className="text-xs text-ink-2 mt-1 mb-3">
          Appears in the invoice header. PNG or JPEG, max 2 MB. Without a logo, "Sjoh" branding is used.
        </p>
        {logoPreview ? (
          <div className="flex items-center gap-3">
            <div className="h-14 w-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden p-1">
              <img src={logoPreview} alt="Your logo" className="max-h-full max-w-full object-contain" />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeLogo}
              className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/5"
            >
              <X className="size-3.5" />
              Remove
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-ink-2 hover:text-primary"
          >
            <ImagePlus className="size-4" />
            Upload your logo
          </button>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-xs text-muted-foreground">Bill to</Label>
          <div className="font-semibold">{customer.name}</div>
          {customer.email && <div className="text-ink-2">{customer.email}</div>}
          {customer.phone && <div className="text-ink-2">{customer.phone}</div>}
        </div>
        <div className="flex items-center justify-end gap-3">
          <Label htmlFor="vat-toggle" className="text-sm">Add VAT (15%)</Label>
          <Switch id="vat-toggle" checked={vatIncluded} onCheckedChange={setVatIncluded} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Line items</Label>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-start">
            <Input
              className="col-span-6"
              placeholder="Description (e.g. Geyser replacement labour)"
              value={item.description}
              onChange={(e) => updateItem(idx, { description: e.target.value })}
            />
            <Input
              className="col-span-2"
              type="number"
              min={1}
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
            />
            <Input
              className="col-span-3"
              type="number"
              min={0}
              step="0.01"
              placeholder="Unit price (R)"
              value={item.unit_price}
              onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) || 0 })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1"
              onClick={() => removeItem(idx)}
              disabled={items.length === 1}
              aria-label="Remove line"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-4" /> Add line
        </Button>
      </div>

      <div>
        <Label htmlFor="invoice-notes" className="text-xs uppercase tracking-wider text-muted-foreground">
          Notes (optional)
        </Label>
        <Textarea
          id="invoice-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1"
        />
      </div>

      <div className="rounded-xl bg-muted/40 border border-border p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-ink-2">Subtotal</span>
          <span>R {totals.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-2">{vatIncluded ? "VAT (15%)" : "VAT"}</span>
          <span>{vatIncluded ? `R ${totals.vat.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` : "Not applicable"}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2 border-t border-border mt-2">
          <span>Total due</span>
          <span className="text-primary">R {totals.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDownload} disabled={busy} className="flex-1 min-w-[160px]">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Download PDF
        </Button>
        <Button
          onClick={handleWhatsApp}
          disabled={busy}
          variant="secondary"
          className="flex-1 min-w-[160px] bg-[#25D366] hover:bg-[#1FB855] text-white"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
          Send via WhatsApp
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>

      <p className="text-xs text-muted-foreground">
        The invoice is saved to your Sjoh records. Sjoh does not handle the payment — settle directly with your customer.
      </p>
    </div>
  );
};
