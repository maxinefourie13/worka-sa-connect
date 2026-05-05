import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type InvoiceLineItem = {
  description: string;
  qty: number;
  unit_price: number;
};

export type InvoiceData = {
  invoice_number: string;
  issued_at: Date;
  business: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    logo_data_url?: string | null; // base64 data URL for custom logo
  };
  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  line_items: InvoiceLineItem[];
  vat_included: boolean;
  notes?: string | null;
};

export type InvoiceTotals = {
  subtotal: number;
  vat: number;
  total: number;
};

const VAT_RATE = 0.15;

export const computeInvoiceTotals = (
  items: InvoiceLineItem[],
  vat_included: boolean,
): InvoiceTotals => {
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unit_price) || 0),
    0,
  );
  const vat = vat_included ? subtotal * VAT_RATE : 0;
  return { subtotal, vat, total: subtotal + vat };
};

const fmtZAR = (n: number) =>
  "R " + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Converts a file to a base64 data URL string for embedding in PDFs.
 * Call this in the UI before passing logo_data_url to generateInvoicePdf.
 */
export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read logo file"));
    reader.readAsDataURL(file);
  });

/**
 * Generates a Sjoh-branded PDF invoice.
 * Returns the jsPDF instance so the caller can either save() or get a Blob.
 * If business.logo_data_url is provided, the logo replaces the "Sjoh" wordmark
 * in the header while a small "via Sjoh" credit remains in the footer.
 */
export const generateInvoicePdf = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // ── Header band ───────────────────────────────────────────────────────────
  doc.setFillColor(0, 35, 149); // #002395 — Sjoh deep blue
  doc.rect(0, 0, pageWidth, 56, "F");

  if (data.business.logo_data_url) {
    // Custom logo: embed image in the left of the header band
    try {
      // Detect format from data URL prefix
      const mime = data.business.logo_data_url.split(";")[0].split(":")[1] || "image/png";
      const format = mime.includes("jpeg") || mime.includes("jpg") ? "JPEG" : "PNG";
      // Fit logo into a 120×36 pt bounding box, vertically centred in the 56pt band
      doc.addImage(data.business.logo_data_url, format, margin, 10, 120, 36);
    } catch {
      // If image embedding fails, fall back to business name text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(data.business.name, margin, 36);
    }
  } else {
    // Default Sjoh wordmark
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Sjoh", margin, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Find someone who can do it properly.", margin + 64, 36);
  }

  // ── Invoice meta (top right) ──────────────────────────────────────────────
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TAX INVOICE", pageWidth - margin, 90, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.invoice_number}`, pageWidth - margin, 108, { align: "right" });
  doc.text(`Date: ${fmtDate(data.issued_at)}`, pageWidth - margin, 122, { align: "right" });

  // ── From / To columns ─────────────────────────────────────────────────────
  let y = 150;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("FROM", margin, y);
  doc.text("BILL TO", pageWidth / 2, y);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  y += 16;
  doc.text(data.business.name, margin, y);
  doc.text(data.customer.name, pageWidth / 2, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  y += 14;

  const fromLines = [
    [data.business.address, data.business.city, data.business.province]
      .filter(Boolean)
      .join(", "),
    data.business.phone ?? "",
    data.business.email ?? "",
  ].filter(Boolean);

  const toLines = [data.customer.phone ?? "", data.customer.email ?? ""].filter(Boolean);

  const maxRows = Math.max(fromLines.length, toLines.length);
  for (let i = 0; i < maxRows; i++) {
    if (fromLines[i]) doc.text(fromLines[i], margin, y + i * 13);
    if (toLines[i]) doc.text(toLines[i], pageWidth / 2, y + i * 13);
  }
  y += maxRows * 13 + 16;

  // ── Line items table ──────────────────────────────────────────────────────
  const totals = computeInvoiceTotals(data.line_items, data.vat_included);

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Unit price", "Amount"]],
    body: data.line_items.map((i) => [
      i.description,
      String(i.qty),
      fmtZAR(Number(i.unit_price)),
      fmtZAR((Number(i.qty) || 0) * (Number(i.unit_price) || 0)),
    ]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 8, textColor: [20, 20, 20] },
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 90 },
      3: { halign: "right", cellWidth: 100 },
    },
    margin: { left: margin, right: margin },
  });

  let afterTableY = (doc as any).lastAutoTable.finalY + 16;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalsX = pageWidth - margin - 200;
  const valX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal", totalsX, afterTableY);
  doc.setTextColor(20, 20, 20);
  doc.text(fmtZAR(totals.subtotal), valX, afterTableY, { align: "right" });
  afterTableY += 16;

  doc.setTextColor(80, 80, 80);
  doc.text(data.vat_included ? "VAT (15%)" : "VAT", totalsX, afterTableY);
  doc.setTextColor(20, 20, 20);
  doc.text(data.vat_included ? fmtZAR(totals.vat) : "Not applicable", valX, afterTableY, { align: "right" });
  afterTableY += 18;

  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX, afterTableY - 6, valX, afterTableY - 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("TOTAL DUE", totalsX, afterTableY + 8);
  doc.setTextColor(0, 35, 149); // #002395 — Sjoh deep blue
  doc.text(fmtZAR(totals.total), valX, afterTableY + 8, { align: "right" });
  afterTableY += 32;

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("NOTES", margin, afterTableY);
    afterTableY += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, afterTableY);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(0, 35, 149);
  doc.setLineWidth(2);
  doc.line(margin, footerY - 14, pageWidth - margin, footerY - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Generated via Sjoh — sjoh.co.za", margin, footerY);
  doc.text("Thank you for your business.", pageWidth - margin, footerY, { align: "right" });

  return doc;
};
