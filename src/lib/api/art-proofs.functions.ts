import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenSchema = z.object({ token: z.string().min(8).max(120) });

const RespondSchema = z.object({
  token: z.string().min(8).max(120),
  approved: z.boolean(),
  feedback: z.string().max(1000).optional(),
});

/**
 * Retorna a prova de arte pública a partir do token do link.
 * Nunca expõe caminho do arquivo — só uma URL assinada de curta duração.
 */
export const getArtProof = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => TokenSchema.parse(v))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: proof } = await supabaseAdmin
      .from("art_proofs")
      .select("id,title,note,status,client_feedback,responded_at,storage_path,mime_type,created_at,clients(name)")
      .eq("token", data.token)
      .maybeSingle();

    if (!proof) return { found: false as const };

    const { data: signed } = await supabaseAdmin.storage
      .from("arquivos")
      .createSignedUrl(proof.storage_path, 60 * 15);

    if (!proof.viewed_at_marked) {
      await supabaseAdmin
        .from("art_proofs")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", proof.id)
        .is("viewed_at", null);
    }

    return {
      found: true as const,
      title: proof.title,
      note: proof.note,
      status: proof.status,
      feedback: proof.client_feedback,
      respondedAt: proof.responded_at,
      clientName: (proof as any).clients?.name ?? null,
      mimeType: proof.mime_type,
      url: signed?.signedUrl ?? null,
    };
  });

/** Cliente aprova ou reprova a arte. Só funciona enquanto estiver pendente. */
export const respondArtProof = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => RespondSchema.parse(v))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("art_proofs")
      .update({
        status: data.approved ? "aprovado" : "reprovado",
        client_feedback: data.feedback?.trim() || null,
        responded_at: new Date().toISOString(),
      })
      .eq("token", data.token)
      .eq("status", "pendente")
      .select("id,status")
      .maybeSingle();

    if (error) return { ok: false as const, message: "Não foi possível registrar sua resposta." };
    if (!updated) return { ok: false as const, message: "Esta arte já foi respondida." };
    return { ok: true as const, status: updated.status };
  });