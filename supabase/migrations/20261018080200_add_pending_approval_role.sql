-- Newly self-registered accounts must not inherit staff access automatically.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aguardando_aprovacao';
