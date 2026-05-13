import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Plus, Trash2, Download, Mail, Loader2, ImagePlus, X } from "lucide-react";
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
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);

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

  const buildAndSave = async (): Promise<{ invoiceId: string | null; invoiceNumber: string; pdfBlob: Blob } | null> => {
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

    let invoiceId = savedInvoiceId;

    if (!savedInvoiceNumber) {
      const { data, error } = await supabase.from("invoices").insert({
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
      }).select("id").single();
      if (error) {
        setBusy(false);
        toast({ title: "Couldn't save invoice", description: error.message, variant: "destructive" });
        return null;
      }
      invoiceId = data?.id ?? null;
      setSavedInvoiceNumber(invoiceNumber);
      setSavedInvoiceId(invoiceId);
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
    return { invoiceId, invoiceNumber, pdfBlob };
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
    toast({ title: "Invoice downloaded", description: "Saved a copy for your records." });
  };

  const handleEmail = async () => {
    const result = await buildAndSave();
    if (!result) return;
    if (!customer.email) {
      toast({ title: "No customer email", description: "Download a copy instead — there isn't an email address on this job.", variant: "destructive" });
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "invoice-sent",
        recipientEmail: customer.email,
        idempotencyKey: `invoice:${result.invoiceId ?? result.invoiceNumber}:sent`,
        templateData: {
          invoiceNumber: result.invoiceNumber,
          businessName: business?.name ?? "Your Sjoh pro",
          customerName: customer.name,
          issuedAt: new Date().toISOString(),
          lineItems: items,
          subtotal: totals.subtotal,
          vat: totals.vat,
          total: totals.total,
          vatIncluded,
          notes,
        },
      },
    });

    if (error || data?.success === false) {
      if (result.invoiceId) {
        await (supabase as any).from("invoices").update({
          status: "failed",
          email_error: error?.message ?? data?.reason ?? "Email could not be queued",
        }).eq("id", result.invoiceId);
      }
      setBusy(false);
      toast({
        title: "Couldn't send invoice",
        description: error?.message ?? "The invoice is saved, but the email did not send. Try again or download a copy.",
        variant: "destructive",
      });
      return;
    }

    if (result.invoiceId) {
      await (supabase as any).from("invoices").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        email_error: null,
      }).eq("id", result.invoiceId);
    }

    setBusy(false);
    toast({ title: "Invoice sent", description: `Sjoh emailed invoice ${result.invoiceNumber} to ${customer.email}.` });
  };

  if (!open) {
    return (
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#101010] p-6 text-white shadow-pop">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F5A623] via-[#DC2828] via-[#0A2463] via-[#0B6E3A] via-[#6B7CE8] to-[#E83E8C]" />
        <div className="absolute -right-16 -top-20 size-48 rounded-full bg-[#F5A623]/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 size-48 rounded-full bg-[#6B7CE8]/20 blur-3xl" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-2xl bg-[#F5A623] flex items-center justify-center shrink-0 text-[#101010] shadow-[6px_6px_0_rgba(255,255,255,0.16)]">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F5A623]">After the quote is accepted</p>
              <h3 className="font-display font-black text-2xl leading-tight mt-1">Generate a Sjoh invoice</h3>
              <p className="text-sm text-white/70 mt-2 max-w-xl">
                Build a polished invoice with your business details, line items, VAT, and direct payment notes.
              </p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-[#F5A623] text-[#101010] hover:bg-[#ffbd3b] rounded-full font-black">
            Create invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#101010] p-6 text-white shadow-pop space-y-6">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F5A623] via-[#DC2828] via-[#0A2463] via-[#0B6E3A] via-[#6B7CE8] to-[#E83E8C]" />
      <div className="absolute -right-20 -top-20 size-56 rounded-full bg-[#F5A623]/15 blur-3xl" />
      <div className="absolute -left-20 bottom-20 size-56 rounded-full bg-[#0A2463]/30 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-2xl bg-[#F5A623] flex items-center justify-center text-[#101010] shadow-[6px_6px_0_rgba(255,255,255,0.16)]">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F5A623]">Invoice builder</p>
            <h3 className="font-display font-black text-2xl leading-tight mt-1">New Sjoh invoice</h3>
            <p className="text-sm text-white/65 mt-2">Add the work, check the totals, then send it to the customer by email.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-black">Total due</div>
          <div className="font-display text-2xl font-black text-[#F5A623]">
            R {totals.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Logo upload */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <Label className="text-xs uppercase tracking-wider text-white/50">
          Your logo (optional)
        </Label>
        <p className="text-xs text-white/55 mt-1 mb-3">
          Appears in the invoice header. PNG or JPEG, max 2 MB. Without a logo, "Sjoh" branding is used.
        </p>
        {logoPreview ? (
          <div className="flex items-center gap-3">
            <div className="h-14 w-32 rounded-xl border border-white/15 bg-white flex items-center justify-center overflow-hidden p-1">
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-dashed border-white/20 hover:border-[#F5A623] hover:bg-[#F5A623]/10 transition-colors text-sm text-white/70 hover:text-[#F5A623]"
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

      <div className="relative grid sm:grid-cols-2 gap-4 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <Label className="text-xs text-white/50 uppercase tracking-wider">Bill to</Label>
          <div className="font-bold mt-1">{customer.name}</div>
          {customer.email && <div className="text-white/60">{customer.email}</div>}
          {customer.phone && <div className="text-white/60">{customer.phone}</div>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 flex items-center justify-between gap-3">
          <Label htmlFor="vat-toggle" className="text-sm">Add VAT (15%)</Label>
          <Switch id="vat-toggle" checked={vatIncluded} onCheckedChange={setVatIncluded} />
        </div>
      </div>

      <div className="relative space-y-3">
        <Label className="text-xs uppercase tracking-wider text-white/50">Line items</Label>
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-start">
            <Input
              className="col-span-6 bg-white text-[#101010] border-white/20"
              placeholder="Description (e.g. Geyser replacement labour)"
              value={item.description}
              onChange={(e) => updateItem(idx, { description: e.target.value })}
            />
            <Input
              className="col-span-2 bg-white text-[#101010] border-white/20"
              type="number"
              min={1}
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
            />
            <Input
              className="col-span-3 bg-white text-[#101010] border-white/20"
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
              className="col-span-1 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => removeItem(idx)}
              disabled={items.length === 1}
              aria-label="Remove line"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10">
          <Plus className="size-4" /> Add line
        </Button>
      </div>

      <div className="relative">
        <Label htmlFor="invoice-notes" className="text-xs uppercase tracking-wider text-white/50">
          Notes (optional)
        </Label>
        <Textarea
          id="invoice-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 bg-white text-[#101010] border-white/20"
        />
      </div>

      <div className="relative rounded-2xl bg-white text-[#101010] border border-white/15 p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-[#3a3d4a]">Subtotal</span>
          <span>R {totals.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#3a3d4a]">{vatIncluded ? "VAT (15%)" : "VAT"}</span>
          <span>{vatIncluded ? `R ${totals.vat.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}` : "Not applicable"}</span>
        </div>
        <div className="flex justify-between font-black text-base pt-2 border-t border-border mt-2">
          <span>Total due</span>
          <span className="text-[#0B6E3A]">R {totals.total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-2">
        <Button onClick={handleEmail} disabled={busy} className="flex-1 min-w-[160px] rounded-full bg-[#F5A623] text-[#101010] hover:bg-[#ffbd3b] font-black">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Send invoice by email
        </Button>
        <Button
          onClick={handleDownload}
          disabled={busy}
          variant="secondary"
          className="flex-1 min-w-[160px] rounded-full bg-white/10 hover:bg-white/15 text-white font-black border border-white/15"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Download copy
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/70 hover:bg-white/10 hover:text-white">Cancel</Button>
      </div>

      <p className="relative text-xs text-white/50">
        The invoice is saved to your Sjoh records. Sjoh does not handle the payment — the customer pays you directly.
      </p>
    </div>
  );
};
