import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type VerificationStatus =
  | "not_required"
  | "required"
  | "pending"
  | "processing"
  | "verified"
  | "failed"
  | "needs_review"
  | "expired";

type SubmissionStatus = "pending" | "processing" | "verified" | "failed" | "needs_review";

interface LatestSubmission {
  id: string;
  status: SubmissionStatus;
  failure_reason: string | null;
  created_at: string;
}

export interface VerificationState {
  isIdVerified: boolean;
  status: VerificationStatus;
  expiresAt: string | null;
  latestSubmission: LatestSubmission | null;
  loading: boolean;
}

interface SubmitDocumentCheckInput {
  businessId: string;
  fullName: string;
  idNumber: string;
  file: File;
}

const mapSubmissionStatus = (
  balanceStatus: VerificationStatus,
  submission?: LatestSubmission | null,
): VerificationStatus => {
  if (!submission) return balanceStatus;
  if (submission.status === "verified") return "verified";
  if (submission.status === "processing") return "processing";
  if (submission.status === "pending") return "pending";
  if (submission.status === "needs_review") return "needs_review";
  if (submission.status === "failed") return "failed";
  return balanceStatus;
};

export const useVerification = () => {
  const { user } = useAuth();
  const [state, setState] = useState<VerificationState>({
    isIdVerified: false,
    status: "not_required",
    expiresAt: null,
    latestSubmission: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setState({
        isIdVerified: false,
        status: "not_required",
        expiresAt: null,
        latestSubmission: null,
        loading: false,
      });
      return;
    }

    const [{ data: balance }, { data: submission }] = await Promise.all([
      supabase
        .from("provider_balances")
        .select("is_id_verified, verification_status, verification_expires_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("id_verification_submissions")
        .select("id, status, failure_reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const balanceStatus = (balance?.verification_status as VerificationStatus) ?? "not_required";
    const latestSubmission = (submission ?? null) as LatestSubmission | null;
    const isIdVerified = balance?.is_id_verified ?? (latestSubmission?.status === "verified");

    setState({
      isIdVerified,
      status: mapSubmissionStatus(balanceStatus, latestSubmission),
      expiresAt: balance?.verification_expires_at ?? null,
      latestSubmission,
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const balanceChannel = supabase
      .channel(`verification-balance-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "provider_balances", filter: `user_id=eq.${user.id}` },
        () => {
          refresh();
        },
      )
      .subscribe();

    const submissionChannel = supabase
      .channel(`verification-submission-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "id_verification_submissions", filter: `user_id=eq.${user.id}` },
        () => {
          refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(submissionChannel);
    };
  }, [user, refresh]);

  const submitDocumentCheck = useCallback(
    async ({ businessId, fullName, idNumber, file }: SubmitDocumentCheckInput) => {
      if (!user) {
        toast({ title: "Sign in required", variant: "destructive" });
        return { ok: false };
      }

      const cleanIdNumber = idNumber.replace(/\D/g, "");
      if (!businessId || !fullName.trim() || cleanIdNumber.length !== 13 || !file) {
        toast({
          title: "Check the details",
          description: "Add your full name, 13-digit SA ID number, and a clear ID document photo.",
          variant: "destructive",
        });
        return { ok: false };
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const documentPath = `${user.id}/${businessId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("id-verification-documents")
        .upload(documentPath, file, { upsert: false });

      if (uploadError) {
        toast({ title: "Couldn't upload ID", description: uploadError.message, variant: "destructive" });
        return { ok: false };
      }

      const { data: submission, error: insertError } = await supabase
        .from("id_verification_submissions")
        .insert({
          user_id: user.id,
          business_id: businessId,
          full_name: fullName.trim(),
          id_number: cleanIdNumber,
          document_path: documentPath,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError || !submission?.id) {
        toast({
          title: "Couldn't start ID check",
          description: insertError?.message ?? "Please try again.",
          variant: "destructive",
        });
        return { ok: false };
      }

      toast({
        title: "ID check started",
        description: "You can keep setting up your profile while Sjoh checks the document.",
      });

      const { data, error } = await supabase.functions.invoke("verify-sa-id", {
        body: { submission_id: submission.id },
      });

      if (error) {
        toast({
          title: "ID check queued",
          description: "Your upload is saved. We'll try process it shortly.",
        });
      } else if (data?.verified) {
        toast({ title: "Sharp, verified!", description: "Your profile can now apply for jobs and send quotes." });
      } else if (data?.status === "needs_review" || data?.status === "failed") {
        toast({
          title: "We couldn't verify it yet",
          description: data?.reason ?? "Try a clearer photo where the name and ID number are readable.",
          variant: "destructive",
        });
      }

      await refresh();
      return { ok: !error, data };
    },
    [user, refresh],
  );

  return { ...state, refresh, submitDocumentCheck };
};
