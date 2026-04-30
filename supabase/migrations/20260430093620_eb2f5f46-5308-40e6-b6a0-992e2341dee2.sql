CREATE TYPE public.quote_revision_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE public.quote_revisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_memo_id uuid NOT NULL REFERENCES public.deal_memos(id) ON DELETE CASCADE,
  pro_user_id uuid NOT NULL,
  previous_amount_zar numeric NOT NULL,
  new_amount_zar numeric NOT NULL CHECK (new_amount_zar >= 0),
  reason text NOT NULL,
  scope_addition text,
  status public.quote_revision_status NOT NULL DEFAULT 'pending',
  responded_at timestamp with time zone,
  responded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_revisions_memo ON public.quote_revisions(deal_memo_id, created_at DESC);

-- Only one pending revision per deal memo at a time
CREATE UNIQUE INDEX idx_quote_revisions_one_pending
  ON public.quote_revisions(deal_memo_id) WHERE status = 'pending';

ALTER TABLE public.quote_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pro, client, admin can view revisions"
ON public.quote_revisions FOR SELECT TO authenticated
USING (
  pro_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.deal_memos dm
    WHERE dm.id = quote_revisions.deal_memo_id
      AND (
        dm.client_user_id = auth.uid()
        OR lower(dm.client_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      )
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins manage all revisions"
ON public.quote_revisions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Pro requests a revision (only on accepted memos they own)
CREATE OR REPLACE FUNCTION public.request_quote_revision(
  _deal_memo_id uuid,
  _new_amount numeric,
  _reason text,
  _scope_addition text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _memo public.deal_memos%ROWTYPE;
  _rev_id uuid;
BEGIN
  IF _new_amount IS NULL OR _new_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 5 THEN
    RAISE EXCEPTION 'Please give a clear reason for the revision';
  END IF;

  SELECT * INTO _memo FROM public.deal_memos WHERE id = _deal_memo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quote not found'; END IF;
  IF _memo.pro_user_id <> auth.uid() THEN RAISE EXCEPTION 'Not your quote'; END IF;
  IF _memo.status <> 'accepted' THEN RAISE EXCEPTION 'Only accepted quotes can be revised'; END IF;

  INSERT INTO public.quote_revisions
    (deal_memo_id, pro_user_id, previous_amount_zar, new_amount_zar, reason, scope_addition)
  VALUES
    (_deal_memo_id, auth.uid(), _memo.total_amount_zar, _new_amount, trim(_reason), _scope_addition)
  RETURNING id INTO _rev_id;

  RETURN _rev_id;
END;
$$;

-- Customer accepts or rejects a pending revision
CREATE OR REPLACE FUNCTION public.respond_to_quote_revision(
  _revision_id uuid,
  _accept boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rev public.quote_revisions%ROWTYPE;
  _memo public.deal_memos%ROWTYPE;
  _email text;
BEGIN
  SELECT * INTO _rev FROM public.quote_revisions WHERE id = _revision_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Revision not found'; END IF;
  IF _rev.status <> 'pending' THEN RAISE EXCEPTION 'This revision has already been answered'; END IF;

  SELECT * INTO _memo FROM public.deal_memos WHERE id = _rev.deal_memo_id;
  _email := lower(COALESCE(auth.jwt() ->> 'email', ''));

  IF _memo.client_user_id IS DISTINCT FROM auth.uid()
     AND lower(_memo.client_email) <> _email THEN
    RAISE EXCEPTION 'Only the customer on this job can respond';
  END IF;

  UPDATE public.quote_revisions
  SET status = CASE WHEN _accept THEN 'accepted'::public.quote_revision_status
                    ELSE 'rejected'::public.quote_revision_status END,
      responded_at = now(),
      responded_by = auth.uid()
  WHERE id = _revision_id;

  IF _accept THEN
    UPDATE public.deal_memos
    SET total_amount_zar = _rev.new_amount_zar,
        scope_of_work = CASE
          WHEN _rev.scope_addition IS NOT NULL AND length(trim(_rev.scope_addition)) > 0
          THEN scope_of_work || E'\n\n— Revision (' || to_char(now(), 'DD Mon YYYY') || '): ' || _rev.scope_addition
          ELSE scope_of_work
        END
    WHERE id = _rev.deal_memo_id;
  END IF;
END;
$$;

-- Pro can cancel their own pending revision
CREATE OR REPLACE FUNCTION public.cancel_quote_revision(_revision_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quote_revisions
  SET status = 'cancelled', responded_at = now()
  WHERE id = _revision_id
    AND status = 'pending'
    AND pro_user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Cannot cancel this revision'; END IF;
END;
$$;