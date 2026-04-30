import { useState } from "react";
import { Download, Trash2, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export const PrivacySection = () => {
  const { signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("account-data", {
        body: { action: "export" },
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sjoh-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Lekker — your data is downloading.",
        description: "Everything we hold on you, in one JSON file.",
      });
    } catch (e) {
      toast({
        title: "Couldn't fetch your data",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("account-data", {
        body: { action: "delete", confirm: "DELETE" },
      });
      if (error) throw error;
      toast({
        title: "Account deleted.",
        description: "We're sorry to see you go. All your personal data has been removed.",
      });
      setDeleteOpen(false);
      await signOut();
      window.location.href = "/";
    } catch (e) {
      toast({
        title: "Couldn't delete your account",
        description: (e as Error).message,
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 mb-2">
          <ShieldCheck className="size-5 text-primary" />
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Your data, your call
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Data & Privacy</h1>
        <p className="text-ink-2 mt-2 max-w-2xl">
          You own your information. Download a copy any time, or wipe your account
          completely — your right under POPIA and GDPR.
        </p>
      </div>

      {/* Download */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Download className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">Download My Data</h3>
            <p className="text-sm text-ink-2 mt-1">
              Get a JSON file with everything we hold on you: profile, business listings,
              quotes, leads, invoices, reviews and notification preferences.
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="mt-4 gap-2"
            >
              {exporting ? (
                <><Loader2 className="size-4 animate-spin" /> Packing it up…</>
              ) : (
                <><Download className="size-4" /> Download my data</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
            <Trash2 className="size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold">Delete My Account</h3>
            <p className="text-sm text-ink-2 mt-1">
              Wipe your profile, business listing, quotes, follows and notification
              settings. Reviews and completed deal records may be kept in pseudonymised
              form for legal and tax reasons. <strong>This cannot be undone.</strong>
            </p>
            <Button
              onClick={() => setDeleteOpen(true)}
              variant="destructive"
              className="mt-4 gap-2"
            >
              <Trash2 className="size-4" /> Delete my account
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Need a hand? Email <a href="mailto:privacy@sjoh.co.za" className="underline">privacy@sjoh.co.za</a>.
      </p>

      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!deleting) setDeleteOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <div className="size-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>Delete your Sjoh account?</DialogTitle>
            <DialogDescription>
              This permanently removes your profile, business, quotes and personal data.
              Type <strong className="text-foreground">DELETE</strong> below to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Yes, delete my account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
