import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DeleteUsersSchema = z.object({
  userIds: z.array(z.string().uuid("ID de usuário inválido")).min(1, "Selecione ao menos um usuário"),
});

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const adminDeleteUsersAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value: unknown) => DeleteUsersSchema.parse(value))
  .handler(async ({ data, context }) => {
    // 1. Verificar se quem chama tem permissão de administrador
    const { data: roles, error: roleError } = await (context.supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const isAdmin = (roles ?? []).some((r: { role: string }) =>
      ["administrador", "admin", "super_admin"].includes(r.role)
    );

    if (roleError || !isAdmin) {
      throw new Error("Apenas administradores podem excluir usuários.");
    }

    // Filtrar para nunca excluir a si próprio
    const targetIds = data.userIds.filter((id) => id !== context.userId);
    if (targetIds.length === 0) {
      throw new Error("Por segurança, você não pode excluir a sua própria conta.");
    }

    const admin = await getAdmin();
    let deletedCount = 0;
    const errors: string[] = [];

    for (const uid of targetIds) {
      try {
        // 1. Tentar chamar a RPC no banco
        const { data: rpcRes, error: rpcErr } = await admin.rpc("delete_user_account", {
          p_user_id: uid,
        });

        if (!rpcErr && rpcRes) {
          deletedCount++;
          continue;
        }

        // 2. Se a RPC não existir ou der erro de função não encontrada, faz a exclusão direta via admin client
        // Desvincular de tabelas relacionadas
        try {
          await admin.from("production_updates").update({ author_id: null, assigned_to: null }).eq("author_id", uid);
          await admin.from("production_updates").update({ assigned_to: null }).eq("assigned_to", uid);
        } catch {}

        try {
          await admin.from("orders").update({ attendant_id: null, created_by: null }).eq("attendant_id", uid);
          await admin.from("orders").update({ created_by: null }).eq("created_by", uid);
        } catch {}

        try {
          await admin.from("quotes").update({ attendant_id: null, created_by: null }).eq("attendant_id", uid);
          await admin.from("quotes").update({ created_by: null }).eq("created_by", uid);
        } catch {}

        try {
          await admin.from("clients").update({ created_by: null }).eq("created_by", uid);
        } catch {}

        // Remover de user_roles
        await admin.from("user_roles").delete().eq("user_id", uid);

        // Remover de profiles
        await admin.from("profiles").delete().eq("id", uid);

        // Remover de auth.users via Admin API
        try {
          await admin.auth.admin.deleteUser(uid);
        } catch (authErr) {
          console.warn(`[adminDeleteUsersAccount] auth.admin.deleteUser para ${uid}:`, authErr);
        }

        deletedCount++;
      } catch (err: any) {
        console.error(`[adminDeleteUsersAccount] Erro ao excluir usuário ${uid}:`, err);
        errors.push(err.message || String(uid));
      }
    }

    return {
      success: true,
      deletedCount,
      errors,
      message: `${deletedCount} usuário(s) excluído(s) com sucesso.`,
    };
  });
