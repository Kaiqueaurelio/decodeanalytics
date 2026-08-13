-- Add fields for landing page customization to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS hero_cta_primary TEXT,
ADD COLUMN IF NOT EXISTS hero_cta_secondary TEXT,
ADD COLUMN IF NOT EXISTS bento_kicker TEXT,
ADD COLUMN IF NOT EXISTS bento_title TEXT,
ADD COLUMN IF NOT EXISTS bento_description TEXT,
ADD COLUMN IF NOT EXISTS how_it_works_title TEXT,
ADD COLUMN IF NOT EXISTS contact_title TEXT,
ADD COLUMN IF NOT EXISTS contact_description TEXT;

-- Seed default values if the table exists
UPDATE public.company_settings
SET 
  hero_title = COALESCE(hero_title, 'IMPRESSÃO<br />PRODUÇÕES GRÁFICAS'),
  hero_subtitle = COALESCE(hero_subtitle, 'Cartões, banners, camisetas, canecas, adesivos e brindes feitos com acabamento profissional pela Alcateia — gráfica que uiva por qualidade.'),
  hero_cta_primary = COALESCE(hero_cta_primary, 'Ver produtos'),
  hero_cta_secondary = COALESCE(hero_cta_secondary, 'Enviar minha arte'),
  bento_kicker = COALESCE(bento_kicker, 'Os favoritos dos IMbatíveis'),
  bento_title = COALESCE(bento_title, 'MAIS PEDIDOS DA GRÁFICA'),
  bento_description = COALESCE(bento_description, 'Preços direto da nossa produção — atualizados em tempo real pelo painel.'),
  how_it_works_title = COALESCE(how_it_works_title, 'Do briefing à entrega em poucos passos'),
  contact_title = COALESCE(contact_title, 'Fale com a Alcateia'),
  contact_description = COALESCE(contact_description, 'Tire dúvidas sobre prazos, materiais ou peça um orçamento personalizado pelo nosso canal oficial.');
