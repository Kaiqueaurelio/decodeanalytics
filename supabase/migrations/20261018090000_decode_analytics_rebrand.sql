-- Rebrand company defaults for Decode Analytics without deleting operational history.
-- Existing clients, quotes, orders, cash entries and receivables are intentionally preserved.
UPDATE public.company_settings
SET name = 'Decode Analytics',
    whatsapp = '11939222885',
    instagram = 'decode.analytics',
    address = NULL,
    document = NULL,
    logo_url = '/brand/decode-logo.png',
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

-- Deactivate old print-shop offers but keep their rows for historical order references.
UPDATE public.services SET active = false, updated_at = now() WHERE active = true;

INSERT INTO public.services (name, category, description, base_price, unit, default_deadline_days, active)
VALUES
  ('Dashboards e Business Intelligence', 'Dados & Business Intelligence', 'Painéis de indicadores e relatórios para apoiar decisões com dados.', 0, 'projeto', 7, true),
  ('Desenvolvimento de Sites e Aplicações', 'Desenvolvimento Web', 'Sites responsivos e aplicações web alinhados às necessidades do negócio.', 0, 'projeto', 14, true),
  ('Automação de Processos', 'Automação de Processos', 'Automação de tarefas repetitivas e integração entre ferramentas.', 0, 'projeto', 7, true),
  ('Consultoria em Tecnologia', 'Consultoria em Tecnologia', 'Diagnóstico técnico e orientação para evolução digital.', 0, 'hora', 3, true),
  ('Design e Identidade Visual', 'Design & Identidade Visual', 'Criação e refinamento de materiais visuais e sistemas de identidade.', 0, 'projeto', 5, true),
  ('Suporte Técnico', 'Suporte Técnico', 'Diagnóstico e suporte para computadores, sistemas e ambientes digitais.', 0, 'atendimento', 3, true),
  ('Marketing Digital e Analytics', 'Marketing Digital', 'Medição, análise e otimização da presença digital.', 0, 'projeto', 7, true);
