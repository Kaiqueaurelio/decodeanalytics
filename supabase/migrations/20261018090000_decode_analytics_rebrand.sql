-- Rebrand company defaults for Decode Analytics without deleting operational history.
-- Existing clients, quotes, orders, cash entries and receivables are intentionally preserved.
UPDATE public.company_settings
SET name = 'Decode Analytics',
    whatsapp = '11939222885',
    instagram = 'decode.analytics',
    address = NULL,
    document = NULL,
    logo_url = '/brand/decode-logo.svg',
    default_quote_text = 'Proposta comercial da Decode Analytics. Valores e escopo sujeitos à confirmação.',
    default_order_text = 'Ordem de serviço da Decode Analytics.',
    hero_title = 'DADOS<br />QUE GERAM IMPACTO',
    hero_subtitle = 'Transformamos dados, tecnologia e processos em soluções digitais práticas para negócios que querem evoluir.',
    hero_cta_primary = 'Conheça as soluções',
    hero_cta_secondary = 'Fale com um especialista',
    bento_kicker = 'Soluções Decode',
    bento_title = 'TECNOLOGIA PARA CRESCER',
    bento_description = 'Serviços digitais sob medida para transformar dados e processos em resultados.',
    how_it_works_title = 'Da necessidade à solução',
    contact_title = 'Vamos conversar sobre seu projeto?',
    contact_description = 'Conte sobre seu desafio e vamos conversar sobre a solução mais adequada para o seu negócio.',
    updated_at = now();

-- Preserve historic rows for past orders, but replace active offers with the items
-- visible in the owner's official WhatsApp catalogue. A price of 0 means "sob consulta".
UPDATE public.services SET active = false, updated_at = now() WHERE active = true;

INSERT INTO public.services
  (name, category, description, base_price, unit, default_deadline_days, active)
VALUES
  ('Encadernação de TCC e Trabalhos Acadêmicos (Capa Mole)', 'Impressão e Acabamentos', 'Encadernação com capa mole para trabalhos acadêmicos.', 0, 'serviço', 3, true),
  ('Laminação e Plastificação', 'Impressão e Acabamentos', 'Proteção e acabamento para documentos e materiais impressos.', 0, 'serviço', 3, true),
  ('Adesivos Personalizados', 'Impressão e Personalização', 'Adesivos personalizados para diferentes aplicações.', 0, 'pedido', 5, true),
  ('Grandes Tiragens de Cartazes e Panfletos', 'Impressão e Personalização', 'Produção de grandes tiragens de cartazes e panfletos.', 0, 'pedido', 7, true),
  ('Panfletos e Flyers', 'Impressão e Personalização', 'Materiais impressos para divulgação.', 0, 'pedido', 5, true),
  ('Convites Personalizados', 'Impressão e Personalização', 'Convites personalizados para ocasiões especiais.', 0, 'pedido', 5, true),
  ('Copos Térmicos Personalizados', 'Personalizados', 'Copos térmicos personalizados. Consulte modelos e disponibilidade.', 0, 'unidade', 5, true),
  ('Canecas Personalizadas', 'Personalizados', 'Canecas personalizadas.', 37, 'unidade', 5, true),
  ('Camisetas Personalizadas', 'Personalizados', 'Camisetas personalizadas.', 75, 'unidade', 7, true),
  ('Cobertura de Eventos e Festas', 'Foto e Vídeo', 'Cobertura fotográfica de eventos e festas.', 0, 'evento', 7, true),
  ('Pacote Office 365 Personal Plus', 'Software e Licenças', 'Oferta apresentada no catálogo. Consulte disponibilidade e condições.', 50, 'licença', 1, true),
  ('Cartões de Visita Personalizados', 'Impressão e Personalização', 'Cartões de visita personalizados.', 60, 'pedido', 5, true),
  ('Edição de Áudio', 'Produção Digital', 'Edição de áudio para seu projeto.', 35, 'projeto', 3, true),
  ('Design para Mídias Sociais Avulso', 'Design e Marketing', 'Peça avulsa para redes sociais.', 45, 'peça', 3, true),
  ('Edição de Vídeos', 'Produção Digital', 'Edição de vídeos para suas ideias e projetos.', 60, 'vídeo', 5, true),
  ('Formatação de Android (Pacote)', 'Suporte Técnico', 'Formatação de Android conforme o pacote anunciado no catálogo.', 55, 'atendimento', 1, true),
  ('Animamos suas Fotos Antigas', 'Imagem e Restauração', 'Animação de fotos antigas para dar vida às memórias.', 65, 'imagem', 3, true),
  ('Remoção de Fundo de Imagens', 'Imagem e Restauração', 'Remoção de fundo de imagens.', 45, 'imagem', 2, true),
  ('Remoção de Objetos e Pessoas', 'Imagem e Restauração', 'Edição de imagens para remover objetos ou pessoas.', 55, 'imagem', 3, true),
  ('Tratamento de Pele Photoshop', 'Imagem e Restauração', 'Tratamento de pele em imagens.', 35, 'imagem', 2, true),
  ('Restauração de Imagens', 'Imagem e Restauração', 'Restauração de fotografias e memórias.', 40, 'imagem', 3, true),
  ('Trabalhos Acadêmicos', 'Serviços Acadêmicos', 'Apoio para trabalhos acadêmicos. Escopo sob consulta.', 0, 'projeto', 7, true),
  ('Banners Acadêmicos', 'Impressão e Personalização', 'Banners para apresentação de trabalhos acadêmicos.', 0, 'unidade', 5, true),
  ('Criação de Sites', 'Desenvolvimento Digital', 'Criação de sites para presença online.', 95, 'projeto', 7, true),
  ('Design para Mídias Sociais Mensal', 'Design e Marketing', 'Pacote mensal de design para redes sociais.', 180, 'mês', 30, true),
  ('Criação de Identidade Visual', 'Design e Marketing', 'Criação de identidade visual para marcas.', 120, 'projeto', 7, true),
  ('Formatação de Android', 'Suporte Técnico', 'Formatação rápida e simples para Android.', 35, 'atendimento', 1, true),
  ('Formatação de iOS', 'Suporte Técnico', 'Formatação de iPhone com as condições descritas no catálogo.', 80, 'atendimento', 1, true),
  ('Formatação de Computadores e Notebooks sem Backup', 'Suporte Técnico', 'Formatação de computador ou notebook sem backup.', 50, 'atendimento', 2, true),
  ('Formatação de Computadores e Notebooks com Backup', 'Suporte Técnico', 'Formatação de computador ou notebook com backup.', 100, 'atendimento', 3, true),
  ('Gestão de Mídias Sociais', 'Design e Marketing', 'Gerenciamento de redes sociais e sites.', 170, 'mês', 30, true),
  ('Criação de Apps', 'Desenvolvimento Digital', 'Desenvolvimento de aplicativos sob medida.', 150, 'projeto', 14, true),
  ('Caderno de Estudos', 'Produtos Digitais', 'Caderno digital UNIP da Decode Analytics.', 10, 'produto', 1, true),
  ('Planner 2025: Administrando sua Vida', 'Produtos Digitais', 'Planner digital apresentado no catálogo.', 21.99, 'produto', 1, true),
  ('Planejamento Social Media', 'Produtos Digitais', 'Material de planejamento para redes sociais. O vídeo mostra R$ 27,99 como preço promocional.', 27.99, 'produto', 1, true),
  ('HackPrompt ChatGPT', 'Produtos Digitais', 'Material digital HackPrompt para apoiar a criatividade com ChatGPT.', 29.99, 'produto', 1, true),
  ('Planner Book (Template)', 'Templates Digitais', 'Template Planner Book.', 30, 'produto', 1, true),
  ('Game Dash v1.0 (Template)', 'Templates Digitais', 'Template de planner gamer no Notion.', 35, 'produto', 1, true),
  ('Cards - Advanced (Template)', 'Templates Digitais', 'Template Cards - Advanced.', 27.90, 'produto', 1, true),
  ('Registro de Hábitos', 'Templates Digitais', 'Template para registrar hábitos.', 35, 'produto', 1, true),
  ('Mapeamento de Metas e Habit Tracker', 'Templates Digitais', 'Template para metas e acompanhamento de hábitos.', 35, 'produto', 1, true),
  ('Planner de Estudos', 'Templates Digitais', 'Template para planejamento de estudos.', 30, 'produto', 1, true);

-- The storefront reads short_description; mirror the catalogue descriptions there too.
UPDATE public.services
SET short_description = description
WHERE name IN (
  'Encadernação de TCC e Trabalhos Acadêmicos (Capa Mole)', 'Laminação e Plastificação',
  'Adesivos Personalizados', 'Grandes Tiragens de Cartazes e Panfletos', 'Panfletos e Flyers',
  'Convites Personalizados', 'Copos Térmicos Personalizados', 'Canecas Personalizadas',
  'Camisetas Personalizadas', 'Cobertura de Eventos e Festas', 'Pacote Office 365 Personal Plus',
  'Cartões de Visita Personalizados', 'Edição de Áudio', 'Design para Mídias Sociais Avulso',
  'Edição de Vídeos', 'Formatação de Android (Pacote)', 'Animamos suas Fotos Antigas',
  'Remoção de Fundo de Imagens', 'Remoção de Objetos e Pessoas', 'Tratamento de Pele Photoshop',
  'Restauração de Imagens', 'Trabalhos Acadêmicos', 'Banners Acadêmicos', 'Criação de Sites',
  'Design para Mídias Sociais Mensal', 'Criação de Identidade Visual', 'Formatação de Android',
  'Formatação de iOS', 'Formatação de Computadores e Notebooks sem Backup',
  'Formatação de Computadores e Notebooks com Backup', 'Gestão de Mídias Sociais', 'Criação de Apps',
  'Caderno de Estudos', 'Planner 2025: Administrando sua Vida', 'Planejamento Social Media',
  'HackPrompt ChatGPT', 'Planner Book (Template)', 'Game Dash v1.0 (Template)',
  'Cards - Advanced (Template)', 'Registro de Hábitos', 'Mapeamento de Metas e Habit Tracker',
  'Planner de Estudos'
);
