ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;

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
  v_sms boolean := coalesce((meta->>'sms_alerts')::boolean, false);
begin
  insert into public.profiles (id, first_name, last_name, phone, sms_alerts)
  values (
    new.id,
    v_first,
    v_last,
    v_phone,
    (v_sms and v_phone is not null)
  );
  return new;
end;
$function$;