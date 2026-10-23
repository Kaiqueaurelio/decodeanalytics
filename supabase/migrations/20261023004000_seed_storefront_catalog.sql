-- Seed the public storefront with active products so the landing page and catalog
-- have real data even on a fresh database.

INSERT INTO public.services (
  name,
  slug,
  category,
  short_description,
  base_price,
  unit,
  default_deadline_days,
  active,
  rating,
  reviews_count,
  min_quantity,
  badge,
  specs
)
SELECT v.name, v.slug, v.category, v.description, v.price, 'un', 3, true, NULL, 0, 1, NULL, ARRAY['Personalizado', 'Entrega sob demanda']::text[]
FROM (
  VALUES
    ('Cartão de Visita Premium', 'cartao-visita-premium', 'Cartões', 'Cartão de visita com acabamento premium para se destacar no mercado.', 69.90),
    ('Panfleto A5 para Promoções', 'panfleto-a5-promocoes', 'Panfletos', 'Panfleto com layout profissional para anunciar ofertas e serviços.', 59.90),
    ('Adesivos Personalizados', 'adesivos-personalizados', 'Adesivos', 'Adesivos para embalagem, loja, veículos e produtos.', 39.90),
    ('Caneca Personalizada', 'caneca-personalizada', 'Canecas', 'Caneca personalizada para presente, marca, loja ou evento.', 49.90),
    ('Camiseta Premium', 'camiseta-premium', 'Camisetas', 'Camiseta com impressão de alta qualidade para time ou marca.', 79.90),
    ('Brinde Corporativo', 'brinde-corporativo', 'Brindes', 'Brinde personalizado para eventos, clientes e campanhas.', 34.90),
    ('Banner para Loja', 'banner-loja', 'Banners', 'Banner de grande formato para divulgação de produto ou marca.', 149.90),
    ('Embalagem Personalizada', 'embalagem-personalizada', 'Embalagens', 'Embalagem premium para valorizar a experiência do cliente.', 89.90),
    ('Plotagem de Vinil', 'plotagem-vinil', 'Plotagem', 'Aplicação em vinil para vitrines, carros e ambientes corporativos.', 129.90),
    ('Encadernação de TCC', 'encadernacao-tcc', 'Encadernação', 'Encadernação profissional para trabalhos acadêmicos e materiais.', 99.90),
    ('Manutenção de Computador', 'manutencao-computador', 'Manutenção de Computadores', 'Diagnóstico, otimização e manutenção para PCs e notebooks.', 149.90),
    ('Criação de Identidade Visual', 'identidade-visual', 'Design Gráfico', 'Identidade visual para marcas que precisam se posicionar melhor.', 399.90),
    ('Landing Page Profissional', 'landing-page-profissional', 'Programação', 'Landing page moderna, responsiva e otimizada para conversão.', 899.90)
) AS v(name, slug, category, description, price)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.services s
  WHERE s.slug = v.slug
     OR lower(s.name) = lower(v.name)
)
ON CONFLICT (slug) DO NOTHING;
