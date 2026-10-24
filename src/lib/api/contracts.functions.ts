import { createServerFn } from "@tanstack/react-start";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TokenSchema = z.object({ token: z.string().min(40).max(80) });
const SendSchema = z.object({ contractId: z.string().uuid() });
const RespondSchema = z.object({
  token: z.string().min(40).max(80),
  decision: z.enum(["aprovado", "recusado"]),
  name: z.string().trim().max(160).optional().default(""),
  reason: z.string().trim().max(1000).optional().default(""),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const sendServiceContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value: unknown) => SendSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { data: roles, error: roleError } = await (context.supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (
      roleError ||
      !(roles ?? []).some((row: { role: string }) =>
        ["administrador", "atendente"].includes(row.role),
      )
    ) {
      throw new Error("Você não tem permissão para enviar contratos.");
    }
    const admin = await getAdmin();
    const { data: contract, error } = await admin
      .from("service_contracts")
      .select("id,number,title,contract_text,amount,billing_mode,version,status")
      .eq("id", data.contractId)
      .maybeSingle();
    if (error || !contract) throw new Error("Contrato não encontrado.");
    if (!contract.contract_text?.trim())
      throw new Error("Revise e salve o texto do contrato antes de enviar.");
    if (["aprovado", "suspenso", "encerrado"].includes(contract.status))
      throw new Error("Este contrato não pode receber uma nova aprovação neste estado.");

    const token = randomBytes(32).toString("base64url");
    const sentAt = new Date().toISOString();
    const version = Number(contract.version ?? 0) + 1;
    const { error: obsoleteError } = await admin
      .from("service_contract_versions")
      .update({ status: "substituido" })
      .eq("contract_id", data.contractId)
      .eq("status", "enviado");
    if (obsoleteError) throw new Error("Não foi possível preparar a nova versão do contrato.");
    const { data: versionRow, error: versionError } = await admin
      .from("service_contract_versions")
      .insert({
        contract_id: data.contractId,
        version,
        content_snapshot: contract.contract_text,
        amount: contract.amount,
        billing_mode: contract.billing_mode,
        status: "enviado",
        sent_at: sentAt,
      })
      .select("id")
      .single();
    if (versionError || !versionRow) throw new Error("Não foi possível salvar a versão enviada.");
    const { error: linkError } = await admin
      .from("service_contract_approval_links")
      .insert({ version_id: versionRow.id, token_hash: hashToken(token) });
    if (linkError) {
      await admin.from("service_contract_versions").delete().eq("id", versionRow.id);
      throw new Error("Não foi possível criar o link privado de aprovação.");
    }
    const { error: updateError } = await admin
      .from("service_contracts")
      .update({
        status: "enviado",
        version,
        sent_at: sentAt,
        responded_at: null,
        approval_name: null,
        response_reason: null,
      })
      .eq("id", data.contractId);
    if (updateError) {
      await admin.from("service_contract_approval_links").delete().eq("version_id", versionRow.id);
      await admin.from("service_contract_versions").delete().eq("id", versionRow.id);
      throw new Error("Não foi possível atualizar o contrato para envio.");
    }
    return { token, version };
  });

export const getPublicServiceContract = createServerFn({ method: "GET" })
  .validator((value: unknown) => TokenSchema.parse(value))
  .handler(async ({ data }) => {
    const admin = await getAdmin();
    const { data: contract, error } = await admin.rpc("get_public_service_contract", {
      p_token_hash: hashToken(data.token),
    });
    if (error) throw new Error("Não foi possível carregar o contrato.");
    return contract ?? null;
  });

export const respondToPublicServiceContract = createServerFn({ method: "POST" })
  .validator((value: unknown) => RespondSchema.parse(value))
  .handler(async ({ data }) => {
    if (data.decision === "aprovado" && data.name.trim().length < 2)
      throw new Error("Informe seu nome para confirmar o aceite.");
    const admin = await getAdmin();
    const { data: accepted, error } = await admin.rpc("respond_to_public_service_contract", {
      p_token_hash: hashToken(data.token),
      p_decision: data.decision,
      p_approval_name: data.decision === "aprovado" ? data.name.trim() : null,
      p_reason: data.decision === "recusado" ? data.reason.trim() || null : null,
    });
    if (error) throw new Error("Não foi possível registrar sua resposta.");
    if (!accepted) throw new Error("Este link expirou ou o contrato já recebeu uma resposta.");
    return { decision: data.decision };
  });
