CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := nullif(trim(coalesce(meta->>'first_name','')), '');
  v_last  text := nullif(trim(coalesce(meta->>'last_name','')), '');
  v_phone text := nullif(trim(coalesce(meta->>'phone','')), '');
  v_display text := nullif(trim(coalesce(meta->>'display_name','')), '');
  v_sms boolean := coalesce((meta->>'sms_alerts')::boolean, false);
begin
  insert into public.profiles (id, display_name, first_name, last_name, phone, sms_alerts)
  values (
    new.id,
    coalesce(v_display, nullif(trim(concat_ws(' ', v_first, v_last)), ''), split_part(new.email, '@', 1)),
    v_first,
    v_last,
    v_phone,
    (v_sms and v_phone is not null)
  );
  return new;
end;
$function$;