
-- Optional Pix key used by receivables WhatsApp payment reminders.
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS pix_key text;
