-- Editable brand identity settings used by the protected admin panel.
alter table public.company_settings
  add column if not exists brand_background text not null default '#0B1026',
  add column if not exists brand_primary text not null default '#22D3EE',
  add column if not exists brand_secondary text not null default '#087CF0',
  add column if not exists brand_accent text not null default '#7138F5';

