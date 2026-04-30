CREATE TYPE public.dispute_status AS ENUM ('open', 'investigating', 'pro_suspended', 'data_provided', 'resolved', 'rejected');
CREATE TYPE public.dispute_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.dispute_category AS ENUM ('fraud', 'no_show', 'poor_workmanship', 'safety', 'harassment', 'payment', 'identity', 'other');

CREATE TABLE public.disputes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text NOT NULL UNIQUE DEFAULT ('DSP-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6)),
  reporter_id uuid,
  reporter_email text,
  reporter_name text,
  business_id uuid,
  pro_user_id uuid,
  deal_memo_id uuid,
  opportunity_id uuid,
  category public.dispute_category NOT NULL DEFAULT 'other',
  severity public.dispute_severity NOT NULL DEFAULT 'medium',
  status public.dispute_status NOT NULL DEFAULT 'open',
  summary text NOT NULL,
  details text,
  evidence_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  pro_suspended_at timestamp with time zone,
  kyc_data_provided_at timestamp with time zone,
  kyc_provided_to text,
  resolution_notes text,
  resolved_at timestamp with time zone,
  assigned_admin_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_business ON public.disputes(business_id);
CREATE INDEX idx_disputes_created ON public.disputes(created_at DESC);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all disputes"
ON public.disputes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Reporter can view their own dispute"
ON public.disputes FOR SELECT TO authenticated
USING (reporter_id = auth.uid());

CREATE POLICY "Authenticated users can file disputes"
ON public.disputes FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_disputes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.touch_disputes_updated_at();

CREATE TABLE public.dispute_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispute_actions_dispute ON public.dispute_actions(dispute_id, created_at DESC);

ALTER TABLE public.dispute_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage dispute actions"
ON public.dispute_actions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_dispute_kyc_package(_dispute_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'dispute', to_jsonb(d.*),
    'business', to_jsonb(b.*),
    'pro_balance', jsonb_build_object(
      'tier', pb.tier,
      'is_id_verified', pb.is_id_verified,
      'verification_status', pb.verification_status,
      'kyc_reference', b.kyc_reference,
      'kyc_verified_at', b.kyc_verified_at,
      'smile_id_job_id', pb.smile_id_job_id,
      'whatsapp_number', pb.whatsapp_number
    ),
    'reporter_profile', to_jsonb(rp.*),
    'actions', COALESCE((
      SELECT jsonb_agg(to_jsonb(da.*) ORDER BY da.created_at)
      FROM public.dispute_actions da WHERE da.dispute_id = d.id
    ), '[]'::jsonb),
    'exported_at', now(),
    'exported_by', auth.uid()
  ) INTO _result
  FROM public.disputes d
  LEFT JOIN public.businesses b ON b.id = d.business_id
  LEFT JOIN public.provider_balances pb ON pb.user_id = d.pro_user_id
  LEFT JOIN public.profiles rp ON rp.id = d.reporter_id
  WHERE d.id = _dispute_id;

  INSERT INTO public.dispute_actions (dispute_id, actor_id, action, notes)
  VALUES (_dispute_id, auth.uid(), 'kyc_exported', 'KYC compliance package generated');

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.suspend_pro_from_dispute(_dispute_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _business_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT business_id INTO _business_id FROM public.disputes WHERE id = _dispute_id;

  IF _business_id IS NOT NULL THEN
    UPDATE public.businesses SET is_suspended = true WHERE id = _business_id;
  END IF;

  UPDATE public.disputes
  SET status = 'pro_suspended',
      pro_suspended_at = COALESCE(pro_suspended_at, now())
  WHERE id = _dispute_id;

  INSERT INTO public.dispute_actions (dispute_id, actor_id, action, notes)
  VALUES (_dispute_id, auth.uid(), 'pro_suspended', COALESCE(_reason, 'Suspended pending investigation'));
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_dispute_kyc_provided(_dispute_id uuid, _provided_to text, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  UPDATE public.disputes
  SET status = 'data_provided',
      kyc_data_provided_at = COALESCE(kyc_data_provided_at, now()),
      kyc_provided_to = _provided_to
  WHERE id = _dispute_id;

  INSERT INTO public.dispute_actions (dispute_id, actor_id, action, notes, metadata)
  VALUES (_dispute_id, auth.uid(), 'kyc_provided_to_authority', _notes, jsonb_build_object('provided_to', _provided_to));
END;
$$;