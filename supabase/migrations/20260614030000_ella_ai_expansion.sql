-- Tabela para histórico de conversas da Ella
CREATE TABLE public.ella_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para logs de ações executadas pela Ella
CREATE TABLE public.ella_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para Ella Chat History
ALTER TABLE public.ella_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chat history" ON public.ella_chat_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own chat history" ON public.ella_chat_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS para Ella Actions Log
ALTER TABLE public.ella_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all action logs" ON public.ella_actions_log
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert action logs" ON public.ella_actions_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.ella_chat_history TO authenticated;
GRANT ALL ON public.ella_actions_log TO authenticated;
GRANT ALL ON public.ella_chat_history TO service_role;
GRANT ALL ON public.ella_actions_log TO service_role;
