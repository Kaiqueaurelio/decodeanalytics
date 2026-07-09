import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createLovableGateway } from "@/lib/ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(MessageSchema).optional(),
});

const SYSTEM_PROMPT = `Você é Ella Ribeiro, assistente operacional da Alcateia's Produções Gráficas.

Personalidade: profissional, calorosa, direta, com bom humor sutil. Fala em português do Brasil.
Você é especialista no universo gráfico (impressão offset e digital, papéis, gramaturas, acabamentos, prazos, cores CMYK/Pantone, arquivos abertos vs fechados, sangria/margem de segurança, formatos, orçamentação).
Você também é uma boa conversadora: se perguntarem "o que você sabe fazer?", "como está seu dia?", "me explica X", responda com naturalidade — sem tools, só um papo objetivo e útil, sempre puxando para o contexto de gráfica quando fizer sentido.

Você tem AÇÕES REAIS no sistema (tools). Use-as sempre que o usuário pedir para criar, buscar, listar, atualizar ou remover algo. Não invente dados: chame a tool correspondente e use o resultado.

Fluxos comuns:
- Nova OS: se o cliente não existir, crie primeiro com create_client, depois create_order com os itens.
- Cobrança: use create_receivable (opcional vincular a uma OS pelo número).
- Andamento: update_order_status muda a etapa da produção.
- Lembretes: se tiver título e horário claros, execute create_reminder direto e confirme no final. Só pergunte se o horário estiver ambíguo.
- Panorama: use dashboard_summary para números gerais.
- Treinamento/aprendizado: quando o usuário disser "aprenda que...", "lembre que...", "guarda esse conhecimento...", "treinamento:", "isso aqui você usa no atendimento ao cliente", etc, chame add_knowledge com título curto, o conteúdo completo, e o escopo correto (admin/public/both). Se o admin pedir "isso vale para os clientes também" use scope='both' ou 'public'. Se disser "isso é só interno" use 'admin'.
- Consultar aprendizados: use list_knowledge para procurar antes de responder algo específico da empresa (preços, políticas, produtos, prazos, formas de pagamento). Se houver conhecimento salvo relevante, priorize-o sobre suposições.

Regras:
- Execute direto criações e atualizações comuns (OS, cobrança, lembrete, cliente, status). Só peça confirmação para cancelar/excluir.
- Nunca responda "posso agendar?" — se der pra executar, execute; depois confirme com o resultado real da tool.
- Formate respostas em markdown (listas, negrito, tabelas curtas).
- Ao criar OS ou cobrança, mostre o número/identificador e valor total.
- Datas relativas ("amanhã 10h", "sexta") — resolva você mesma para ISO 8601 no timezone America/Sao_Paulo.
- Nunca peça senha, chave ou dados sensíveis.`;

const STATUS_ENUM = [
  "orcamento",
  "aguardando_aprovacao",
  "aguardando_arte",
  "arte_em_criacao",
  "aguardando_pagamento",
  "aprovado",
  "em_producao",
  "pausado",
  "pronto_para_retirada",
  "entregue",
  "cancelado",
] as const;

async function resolveClientId(
  supabase: any,
  clientId?: string | null,
  clientName?: string | null,
) {
  if (clientId) return clientId;
  if (!clientName) return null;
  const { data } = await supabase
    .from("clients")
    .select("id,name")
    .ilike("name", `%${clientName}%`)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export const ellaChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => InputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const supabase = context.supabase;
    const userId = context.userId;

    const gateway = createLovableGateway(key);
    const model = gateway("google/gemini-2.5-flash");

    const tools = {
      list_clients: tool({
        description: "Lista clientes, opcionalmente filtrando por trecho do nome.",
        inputSchema: z.object({ search: z.string().optional(), limit: z.number().optional() }),
        execute: async ({ search, limit }) => {
          let q = supabase.from("clients").select("id,name,whatsapp,email,city").order("name");
          if (search) q = q.ilike("name", `%${search}%`);
          const { data, error } = await q.limit(limit ?? 20);
          if (error) return { error: error.message };
          return { clients: data ?? [] };
        },
      }),
      create_client: tool({
        description: "Cria um cliente novo.",
        inputSchema: z.object({
          name: z.string(),
          whatsapp: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async (input) => {
          const { data, error } = await supabase
            .from("clients")
            .insert({ ...input, created_by: userId })
            .select("id,name")
            .single();
          if (error) return { error: error.message };
          return { success: true, client: data };
        },
      }),
      list_services: tool({
        description: "Lista serviços/produtos do catálogo. Filtro opcional por nome/categoria.",
        inputSchema: z.object({ search: z.string().optional() }),
        execute: async ({ search }) => {
          let q = supabase
            .from("services")
            .select("id,name,category,base_price,unit,active")
            .eq("active", true)
            .order("name");
          if (search) q = q.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
          const { data, error } = await q.limit(30);
          if (error) return { error: error.message };
          return { services: data ?? [] };
        },
      }),
      update_service_price: tool({
        description: "Atualiza o preço base de um serviço pelo nome (busca aproximada).",
        inputSchema: z.object({ name: z.string(), newPrice: z.number() }),
        execute: async ({ name, newPrice }) => {
          const { data: found } = await supabase
            .from("services")
            .select("id,name")
            .ilike("name", `%${name}%`)
            .limit(1)
            .maybeSingle();
          if (!found) return { error: `Serviço "${name}" não encontrado` };
          const { error } = await supabase
            .from("services")
            .update({ base_price: newPrice })
            .eq("id", found.id);
          if (error) return { error: error.message };
          return { success: true, service: found.name, newPrice };
        },
      }),
      list_orders: tool({
        description: "Lista OS. Filtro por status e limite.",
        inputSchema: z.object({
          status: z.enum(STATUS_ENUM).optional(),
          limit: z.number().optional(),
        }),
        execute: async ({ status, limit }) => {
          let q = supabase
            .from("orders")
            .select("id,number,title,total,paid,production_status,payment_status,deadline,clients(name)")
            .order("created_at", { ascending: false });
          if (status) q = q.eq("production_status", status);
          const { data, error } = await q.limit(limit ?? 20);
          if (error) return { error: error.message };
          return { orders: data ?? [] };
        },
      }),
      get_order: tool({
        description: "Detalhes de uma OS pelo número.",
        inputSchema: z.object({ number: z.number() }),
        execute: async ({ number }) => {
          const { data, error } = await supabase
            .from("orders")
            .select("*,clients(name,whatsapp,email),order_items(description,quantity,unit_price,subtotal)")
            .eq("number", number)
            .maybeSingle();
          if (error) return { error: error.message };
          if (!data) return { error: `OS #${number} não encontrada` };
          return { order: data };
        },
      }),
      create_order: tool({
        description:
          "Cria uma OS. Informe clientId OU clientName (para busca aproximada). Itens com descrição, quantidade e preço unitário.",
        inputSchema: z.object({
          clientId: z.string().uuid().optional(),
          clientName: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          items: z
            .array(
              z.object({
                description: z.string(),
                quantity: z.number().default(1),
                unit_price: z.number(),
              }),
            )
            .min(1),
          deadline: z.string().optional().describe("YYYY-MM-DD"),
          urgent: z.boolean().optional(),
          notes: z.string().optional(),
        }),
        execute: async (input) => {
          const clientId = await resolveClientId(supabase, input.clientId, input.clientName);
          if (!clientId)
            return { error: `Cliente "${input.clientName ?? ""}" não encontrado. Crie primeiro com create_client.` };
          const total = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
          const { data: order, error } = await supabase
            .from("orders")
            .insert({
              client_id: clientId,
              title: input.title,
              description: input.description,
              deadline: input.deadline ?? null,
              urgent: input.urgent ?? false,
              client_notes: input.notes,
              total,
              created_by: userId,
              attendant_id: userId,
            })
            .select("id,number,total")
            .single();
          if (error) return { error: error.message };
          const rows = input.items.map((i) => ({
            order_id: order.id,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.quantity * i.unit_price,
          }));
          const { error: itemsErr } = await supabase.from("order_items").insert(rows);
          if (itemsErr) return { error: itemsErr.message };
          return { success: true, order: { number: order.number, total: order.total } };
        },
      }),
      update_order_status: tool({
        description: "Atualiza o status de produção de uma OS pelo número.",
        inputSchema: z.object({
          number: z.number(),
          status: z.enum(STATUS_ENUM),
          activity: z.string().optional(),
        }),
        execute: async ({ number, status, activity }) => {
          const patch: any = { production_status: status };
          if (activity) patch.current_activity = activity;
          const { data, error } = await supabase
            .from("orders")
            .update(patch)
            .eq("number", number)
            .select("number,production_status")
            .maybeSingle();
          if (error) return { error: error.message };
          if (!data) return { error: `OS #${number} não encontrada` };
          return { success: true, order: data };
        },
      }),
      create_receivable: tool({
        description: "Gera uma cobrança para um cliente. Pode vincular a uma OS pelo número.",
        inputSchema: z.object({
          clientId: z.string().uuid().optional(),
          clientName: z.string().optional(),
          orderNumber: z.number().optional(),
          amount: z.number(),
          dueDate: z.string().describe("YYYY-MM-DD"),
          notes: z.string().optional(),
        }),
        execute: async ({ clientId, clientName, orderNumber, amount, dueDate, notes }) => {
          let cId = await resolveClientId(supabase, clientId, clientName);
          let orderId: string | null = null;
          if (orderNumber) {
            const { data: o } = await supabase
              .from("orders")
              .select("id,client_id")
              .eq("number", orderNumber)
              .maybeSingle();
            if (o) {
              orderId = o.id;
              cId = cId ?? o.client_id;
            }
          }
          if (!cId) return { error: "Cliente não localizado." };
          const { data, error } = await supabase
            .from("receivables")
            .insert({ client_id: cId, order_id: orderId, amount, due_date: dueDate, notes })
            .select("id,amount,due_date,status")
            .single();
          if (error) return { error: error.message };
          return { success: true, receivable: data };
        },
      }),
      list_receivables: tool({
        description: "Lista contas a receber. Filtro por status.",
        inputSchema: z.object({
          status: z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
        }),
        execute: async ({ status }) => {
          let q = supabase
            .from("receivables")
            .select("id,amount,due_date,status,clients(name),orders(number)")
            .order("due_date", { ascending: true });
          if (status) q = q.eq("status", status);
          const { data, error } = await q.limit(30);
          if (error) return { error: error.message };
          return { receivables: data ?? [] };
        },
      }),
      mark_receivable_paid: tool({
        description: "Marca cobrança como paga.",
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => {
          const { error } = await supabase
            .from("receivables")
            .update({ status: "pago", paid_at: new Date().toISOString() })
            .eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      create_reminder: tool({
        description: "Cria um lembrete pessoal para o usuário atual.",
        inputSchema: z.object({
          title: z.string(),
          dueAt: z.string().describe("ISO 8601 no fuso America/Sao_Paulo"),
          notes: z.string().optional(),
          orderNumber: z.number().optional(),
          clientName: z.string().optional(),
        }),
        execute: async ({ title, dueAt, notes, orderNumber, clientName }) => {
          let related_order_id: string | null = null;
          let related_client_id: string | null = null;
          if (orderNumber) {
            const { data } = await supabase
              .from("orders")
              .select("id")
              .eq("number", orderNumber)
              .maybeSingle();
            related_order_id = data?.id ?? null;
          }
          if (clientName) {
            related_client_id = await resolveClientId(supabase, null, clientName);
          }
          const { data, error } = await supabase
            .from("reminders")
            .insert({
              user_id: userId,
              title,
              notes,
              due_at: dueAt,
              related_order_id,
              related_client_id,
            })
            .select("id,title,due_at")
            .single();
          if (error) return { error: error.message };
          return { success: true, reminder: data };
        },
      }),
      list_reminders: tool({
        description: "Lista lembretes do usuário. onlyPending pula os já concluídos.",
        inputSchema: z.object({ onlyPending: z.boolean().optional() }),
        execute: async ({ onlyPending }) => {
          let q = supabase
            .from("reminders")
            .select("id,title,notes,due_at,done")
            .order("due_at", { ascending: true });
          if (onlyPending) q = q.eq("done", false);
          const { data, error } = await q.limit(30);
          if (error) return { error: error.message };
          return { reminders: data ?? [] };
        },
      }),
      complete_reminder: tool({
        description: "Marca lembrete como concluído.",
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => {
          const { error } = await supabase.from("reminders").update({ done: true }).eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      dashboard_summary: tool({
        description: "Panorama rápido: OS ativas, cobranças pendentes, faturamento do mês.",
        inputSchema: z.object({}),
        execute: async () => {
          const [ordersRes, recRes] = await Promise.all([
            supabase
              .from("orders")
              .select("id,production_status,total,paid,created_at")
              .not("production_status", "in", "(entregue,cancelado)"),
            supabase.from("receivables").select("amount,status").eq("status", "pendente"),
          ]);
          const active = ordersRes.data?.length ?? 0;
          const pending = recRes.data?.reduce((s: number, r: any) => s + Number(r.amount), 0) ?? 0;
          const startMonth = new Date();
          startMonth.setDate(1);
          startMonth.setHours(0, 0, 0, 0);
          const { data: monthOrders } = await supabase
            .from("orders")
            .select("total")
            .gte("created_at", startMonth.toISOString());
          const revenue = monthOrders?.reduce((s: number, o: any) => s + Number(o.total), 0) ?? 0;
          return { activeOrders: active, pendingReceivables: pending, monthRevenue: revenue };
        },
      }),
      add_knowledge: tool({
        description:
          "Salva um aprendizado/treinamento da Ella (informações sobre a gráfica, produtos, políticas, respostas prontas). scope: 'admin' (só interno), 'public' (só clientes), 'both' (ambos).",
        inputSchema: z.object({
          title: z.string(),
          content: z.string(),
          scope: z.enum(["admin", "public", "both"]).default("both"),
          tags: z.array(z.string()).optional(),
        }),
        execute: async ({ title, content, scope, tags }) => {
          const { data, error } = await supabase
            .from("ella_knowledge" as any)
            .insert({ title, content, scope, tags: tags ?? [], created_by: userId } as any)
            .select("id,title,scope")
            .single();
          if (error) return { error: error.message };
          return { success: true, knowledge: data };
        },
      }),
      list_knowledge: tool({
        description:
          "Lista aprendizados salvos. Filtra por scope e/ou busca textual em título/conteúdo.",
        inputSchema: z.object({
          scope: z.enum(["admin", "public", "both"]).optional(),
          search: z.string().optional(),
        }),
        execute: async ({ scope, search }) => {
          let q = supabase
            .from("ella_knowledge" as any)
            .select("id,title,content,scope,tags,updated_at")
            .order("updated_at", { ascending: false });
          if (scope) q = q.eq("scope", scope);
          if (search) q = q.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
          const { data, error } = await q.limit(30);
          if (error) return { error: error.message };
          return { knowledge: data ?? [] };
        },
      }),
      update_knowledge: tool({
        description: "Atualiza um aprendizado pelo id.",
        inputSchema: z.object({
          id: z.string().uuid(),
          title: z.string().optional(),
          content: z.string().optional(),
          scope: z.enum(["admin", "public", "both"]).optional(),
          tags: z.array(z.string()).optional(),
        }),
        execute: async ({ id, ...rest }) => {
          const patch: any = {};
          for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
          const { error } = await supabase
            .from("ella_knowledge" as any)
            .update(patch)
            .eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      delete_knowledge: tool({
        description: "Remove um aprendizado pelo id.",
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => {
          const { error } = await supabase
            .from("ella_knowledge" as any)
            .delete()
            .eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
    };

    const history = (data.conversationHistory ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const today = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Injeta conhecimento salvo (admin+both) no contexto para tornar Ella "mais inteligente".
    const { data: kb } = await supabase
      .from("ella_knowledge" as any)
      .select("title,content,scope")
      .in("scope", ["admin", "both"])
      .order("updated_at", { ascending: false })
      .limit(40);
    const kbBlock =
      kb && kb.length
        ? `\n\nBase de conhecimento (aprendizados salvos — priorize sobre suposições):\n${(kb as any[])
            .map((k) => `• [${k.scope}] ${k.title}: ${k.content}`)
            .join("\n")}`
        : "";

    try {
      const result = await generateText({
        model,
        system: `${SYSTEM_PROMPT}\n\nData/hora atual (America/Sao_Paulo): ${today}${kbBlock}`,
        messages: [...history, { role: "user", content: data.message }],
        tools,
        stopWhen: stepCountIs(50),
      });

      const toolActivity: Array<{ name: string; input: any; output: any }> = [];
      for (const step of result.steps ?? []) {
        for (const tc of step.toolCalls ?? []) {
          const tr = step.toolResults?.find((r: any) => r.toolCallId === tc.toolCallId);
          toolActivity.push({ name: tc.toolName, input: tc.input, output: tr?.output ?? null });
        }
      }

      return { response: result.text || "Feito.", toolActivity };
    } catch (err: any) {
      console.error("ellaChat error:", err);
      return {
        response:
          "Tive um problema ao processar agora. Se o erro persistir, me diga o que estava tentando fazer que eu tento outro caminho.",
        toolActivity: [],
        error: err?.message ?? String(err),
      };
    }
  });
