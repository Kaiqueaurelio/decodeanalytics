-- Preenche o documento fiscal da empresa informado pelo proprietário.
-- A condição evita substituir um cadastro já preenchido manualmente.
UPDATE public.company_settings
SET document = '58.294.735/0001-55',
    updated_at = now()
WHERE document IS NULL OR btrim(document) = '';
