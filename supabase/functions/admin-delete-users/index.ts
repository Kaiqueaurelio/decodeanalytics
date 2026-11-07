import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método não permitido" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return new Response(JSON.stringify({ error: "Função sem chave administrativa configurada." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  const token = req.headers.get("Authorization") ?? "";
  const caller = createClient(url, anon, { global: { headers: { Authorization: token } } });
  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return new Response(JSON.stringify({ error: "Sessão inválida." }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  const admin = createClient(url, serviceKey);
  const { data: roleRows, error: roleError } = await admin.from("user_roles").select("role").eq("user_id", authData.user.id);
  if (roleError || !roleRows?.some((r) => r.role === "administrador")) return new Response(JSON.stringify({ error: "Apenas administradores podem excluir usuários." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.userIds) ? [...new Set(body.userIds.filter((id: unknown) => typeof id === "string"))] : [];
  if (!ids.length || ids.length > 100) return new Response(JSON.stringify({ error: "Selecione de 1 a 100 usuários." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  if (ids.includes(authData.user.id)) return new Response(JSON.stringify({ error: "Você não pode excluir sua própria conta por esta tela." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  const { data: targets, error: targetError } = await admin.from("user_roles").select("user_id,role").in("user_id", ids);
  if (targetError) return new Response(JSON.stringify({ error: "Não foi possível validar os usuários selecionados." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  const adminsToDelete = (targets ?? []).filter((r) => r.role === "administrador").length;
  const { count: adminCount, error: countError } = await admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "administrador");
  if (countError || (adminCount ?? 0) - adminsToDelete < 1) return new Response(JSON.stringify({ error: "Não é permitido excluir o último administrador." }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
  let deletedCount = 0;
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return new Response(JSON.stringify({ error: "Falha ao excluir usuário após " + deletedCount + " exclusões: " + error.message, deletedCount }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    deletedCount++;
  }
  return new Response(JSON.stringify({ deletedCount }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
});