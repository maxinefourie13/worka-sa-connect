-- 1. Columns on provider_balances
ALTER TABLE public.provider_balances
  ADD COLUMN IF NOT EXISTS founding_proposals_used_this_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS founding_proposals_period_start timestamptz NOT NULL DEFAULT date_trunc('month', now());

-- 2. is_founding_member helper
CREATE OR REPLACE FUNCTION public.is_founding_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.early_access_signups s ON lower(s.email) = lower(u.email)
    WHERE u.id = _user_id
      AND s.claimed_founding_spot = true
      AND s.role = 'pro'
  );
$$;

-- 3. can_use_founding_proposal helper
CREATE OR REPLACE FUNCTION public.can_use_founding_proposal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_founding_member(_user_id)
    AND COALESCE(
      (
        SELECT
          CASE
            WHEN pb.founding_proposals_period_start < date_trunc('month', now()) THEN true
            ELSE pb.founding_proposals_used_this_month < 1
          END
        FROM public.provider_balances pb
        WHERE pb.user_id = _user_id
      ),
      true -- no balances row yet → fresh credit
    );
$$;

-- 4. Update submit_proposal: allow founding-member free path
CREATE OR REPLACE FUNCTION public.submit_proposal(_opportunity_id uuid, _business_id uuid, _message text, _quote_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _proposal_id uuid;
  _is_owner boolean;
  _is_suspended boolean;
  _is_verified boolean;
  _opp_status opportunity_status;
  _existing uuid;
  _has_pro boolean;
  _can_use_free boolean;
begin
  if auth.uid() is null then
    raise exception 'Sign in to submit a proposal';
  end if;

  if _message is null or length(trim(_message)) < 20 then
    raise exception 'Your pitch needs at least 20 characters';
  end if;

  select (owner_id = auth.uid()), is_suspended, is_verified
    into _is_owner, _is_suspended, _is_verified
    from public.businesses where id = _business_id;

  if not coalesce(_is_owner, false) then
    raise exception 'You do not own this business';
  end if;
  if _is_suspended then
    raise exception 'This business is suspended';
  end if;

  _has_pro := public.has_verified_pro_access(auth.uid());
  _can_use_free := (not _has_pro) and public.can_use_founding_proposal(auth.uid());

  if _has_pro then
    -- Ready for Work path: still requires verified business
    if not _is_verified then
      raise exception 'Only verified businesses can submit proposals';
    end if;
  elsif _can_use_free then
    -- Founding-member free path: no verification required
    null;
  else
    if public.is_founding_member(auth.uid()) then
      raise exception 'You''ve used your founding-member proposal for this month. Upgrade to Ready for Work to apply to as many jobs as you like.';
    else
      raise exception 'Only Ready for Work subscribers can apply for jobs. Upgrade to apply.';
    end if;
  end if;

  select status into _opp_status from public.opportunities where id = _opportunity_id;
  if _opp_status is null then
    raise exception 'Opportunity not found';
  end if;
  if _opp_status <> 'open' then
    raise exception 'This job is no longer open';
  end if;

  select id into _existing
    from public.proposals
    where opportunity_id = _opportunity_id and business_id = _business_id;
  if _existing is not null then
    raise exception 'You''ve already submitted a proposal for this job';
  end if;

  insert into public.proposals (
    opportunity_id, business_id, provider_id, message, quote_amount
  )
  values (
    _opportunity_id, _business_id, auth.uid(), _message, _quote_amount
  )
  returning id into _proposal_id;

  -- If we used the free path, decrement / roll over the counter atomically
  if _can_use_free then
    insert into public.provider_balances (user_id, founding_proposals_used_this_month, founding_proposals_period_start)
    values (auth.uid(), 1, date_trunc('month', now()))
    on conflict (user_id) do update set
      founding_proposals_used_this_month = case
        when public.provider_balances.founding_proposals_period_start < date_trunc('month', now()) then 1
        else public.provider_balances.founding_proposals_used_this_month + 1
      end,
      founding_proposals_period_start = date_trunc('month', now()),
      updated_at = now();
  end if;

  update public.opportunities
    set applicants_count = applicants_count + 1, updated_at = now()
    where id = _opportunity_id;

  return _proposal_id;
end;
$function$;