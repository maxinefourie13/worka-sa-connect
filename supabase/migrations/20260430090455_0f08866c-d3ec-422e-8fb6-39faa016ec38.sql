-- 1. Column
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_verified_transaction boolean NOT NULL DEFAULT false;

-- 2. Backfill: mark prior verified-hire reviews as verified transactions only
-- when their deal memo was accepted >= 24h before the review
UPDATE public.reviews r
   SET is_verified_transaction = true
  FROM public.deal_memos dm
 WHERE r.deal_memo_id = dm.id
   AND r.is_verified_hire = true
   AND dm.accepted_at IS NOT NULL
   AND r.created_at >= dm.accepted_at + interval '24 hours';

-- 3. Tighten submit_verified_review: enforce 24-hour anti-self-review window
-- and set is_verified_transaction.
CREATE OR REPLACE FUNCTION public.submit_verified_review(
  _deal_memo_id uuid,
  _rating integer,
  _body text,
  _reviewer_name text,
  _reviewer_company text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _business_id uuid;
  _client uuid;
  _client_email text;
  _viewer_email text := lower(coalesce((auth.jwt() ->> 'email')::text, ''));
  _status public.deal_memo_status;
  _accepted_at timestamptz;
  _existing uuid;
  _review_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in to leave your review'; end if;
  if _rating < 1 or _rating > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  if _body is null or length(trim(_body)) < 10 then
    raise exception 'Tell us a bit more — at least 10 characters';
  end if;

  select business_id, client_user_id, lower(client_email), status, accepted_at
  into _business_id, _client, _client_email, _status, _accepted_at
  from public.deal_memos where id = _deal_memo_id;

  if _business_id is null then raise exception 'Quote not found'; end if;
  if _status <> 'completed' then raise exception 'You can only review a completed job'; end if;
  if coalesce(_client, auth.uid()) <> auth.uid() and _client_email <> _viewer_email then
    raise exception 'Only the client on this quote can leave the review';
  end if;

  -- Anti-self-review: require >= 24h between acceptance and review submission
  if _accepted_at is null or now() < _accepted_at + interval '24 hours' then
    raise exception 'Reviews unlock 24 hours after a quote is accepted. Hang tight, boet.';
  end if;

  select id into _existing from public.reviews where deal_memo_id = _deal_memo_id;
  if _existing is not null then
    raise exception 'You''ve already reviewed this job';
  end if;

  insert into public.reviews (
    business_id, reviewer_id, reviewer_name, reviewer_company,
    rating, body, deal_memo_id, is_verified_hire, is_verified_transaction
  ) values (
    _business_id, auth.uid(), _reviewer_name, _reviewer_company,
    _rating, _body, _deal_memo_id, true, true
  ) returning id into _review_id;

  return _review_id;
end;
$function$;