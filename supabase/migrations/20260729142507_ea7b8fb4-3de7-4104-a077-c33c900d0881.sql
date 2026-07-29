UPDATE public.services SET active = false
WHERE name ILIKE '%enel%'
   OR name IN ('Boné Bordado','Moletom Bordado');

UPDATE public.company_settings SET show_prices = false;