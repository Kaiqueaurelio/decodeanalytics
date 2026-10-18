-- Produtos legíveis no catálogo WhatsApp mostrado pelo cliente.
-- A migração evita duplicar produtos que já existam pelo slug ou nome.
INSERT INTO public.services
  (name, slug, category, short_description, base_price, unit, default_deadline_days,
   active, rating, reviews_count, min_quantity, badge, specs)
SELECT v.name, v.slug, v.category, v.description, v.price, 'un', 3,
       true, NULL, 0, NULL, NULL, ARRAY['Personalizado', 'Orçamento pelo WhatsApp']::text[]
FROM (VALUES
  ('Encadernação de TCC e Trabalhos Acadêmicos (Capa Mole)', 'encadernacao-tcc-capa-mole', 'Encadernação', 'Encadernação de trabalhos acadêmicos com capa mole. Consulte opções e acabamento.', 0::numeric),
  ('Laminação e Plastificação', 'laminacao-plastificacao', 'Laminação e Plastificação', 'Serviço de laminação e plastificação para proteger e valorizar seus materiais.', 0::numeric),
  ('Adesivos Personalizados', 'adesivos-personalizados-catalogo', 'Adesivos', 'Adesivos personalizados para destacar sua marca em diferentes aplicações.', 0::numeric),
  ('Grandes Tiragens de Cartazes e Panfletos', 'grandes-tiragens-cartazes-panfletos', 'Cartazes', 'Produção de cartazes e panfletos em grandes tiragens. Solicite um orçamento.', 0::numeric),
  ('Panfletos e Flyers', 'panfletos-e-flyers-catalogo', 'Panfletos', 'Panfletos e flyers personalizados para divulgar sua marca e seus serviços.', 0::numeric),
  ('Convites Personalizados', 'convites-personalizados-catalogo', 'Convites', 'Convites personalizados para ocasiões especiais. Consulte modelos e acabamentos.', 0::numeric),
  ('Copos Térmicos Personalizados', 'copos-termicos-personalizados-catalogo', 'Copos Térmicos', 'Copos térmicos personalizados. Consulte opções de personalização e disponibilidade.', 0::numeric),
  ('Canecas Personalizadas', 'canecas-personalizadas-catalogo', 'Canecas', 'Canecas personalizadas. O catálogo em vídeo informa o valor de R$ 37,00.', 37::numeric)
) AS v(name, slug, category, description, price)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.slug = v.slug OR lower(s.name) = lower(v.name)
)
ON CONFLICT (slug) DO NOTHING;
