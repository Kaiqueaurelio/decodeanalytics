import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { resolveEllaModel, aiTimeoutSignal } from "@/lib/ai-gateway.server";
import {
  ADMIN_SYSTEM_PROMPT,
  STATUS_ENUM,
  resolveClientId,
  transcribeAttachment,
} from "./ella.helpers.server";
import { classifyAiError, logAiEvent, newTraceId } from "./ai-logs.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const AttachmentSchema = z.object({
  name: z.string(),
  mimeType: z.string(),
  dataBase64: z.string(),
});

const InputSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(MessageSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),
});

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const clean = String(value ?? "0")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  return Number(clean) || 0;
}

function inferCategory(name: string, category?: string) {
  const text = normalizeText(`${name} ${category ?? ""}`);
  if (/cartao|cartoes|visita|card/.test(text)) return "Cartões";
  if (/panfleto|flyer|folder|folheto/.test(text)) return "Panfletos";
  if (/adesivo|etiqueta|recorte|sticker/.test(text)) return "Adesivos";
  if (/banner|lona|faixa|cavalete/.test(text)) return "Banners";
  if (/caneca|copo/.test(text)) return "Canecas";
  if (/camiseta|camisa|uniforme/.test(text)) return "Camisetas";
  if (/embalagem|caixa|sacola/.test(text)) return "Embalagens";
  if (/plotagem|planta|projeto/.test(text)) return "Plotagem";
  if (/brinde|chaveiro|squeeze|personalizado/.test(text)) return "Brindes";
  return category?.trim() || "Outros";
}

function imagePathFor(category: string, name: string) {
  const resolved = inferCategory(name, category);
  const paths: Record<string, string> = {
    Cartões: "/products/cartoes.jpg",
    Panfletos: "/products/panfletos.jpg",
    Adesivos: "/products/adesivos.jpg",
    Banners: "/products/banners.webp",
    Canecas: "/products/canecas.jpg",
    Camisetas: "/products/camisetas.jpg",
    Brindes: "/products/brindes.webp",
    Embalagens: "/products/embalagens.webp",
    Plotagem: "/products/plotagem.webp",
  };
  return paths[resolved] ?? null;
}

function buildServiceDescription(name: string, category: string, custom?: string) {
  if (custom?.trim()) return custom.trim();
  const descriptions: Record<string, string> = {
    Cartões: "Material impresso para apresentação profissional da marca, com acabamento de qualidade e produção sob demanda.",
    Panfletos: "Impresso promocional para divulgar ofertas, eventos e serviços com boa leitura e impacto visual.",
    Adesivos: "Adesivo personalizado para identificação, embalagem, decoração ou campanhas promocionais.",
    Banners: "Comunicação visual em lona ou material similar para loja, evento, fachada ou ação promocional.",
    Canecas: "Produto personalizado para presente, brinde corporativo ou venda com arte aplicada.",
    Camisetas: "Vestuário personalizado para equipe, evento, uniforme ou ação de marca.",
    Embalagens: "Solução de embalagem personalizada para valorizar o produto e reforçar a identidade visual.",
    Plotagem: "Impressão técnica ou visual em grande formato para projetos, plantas e comunicação.",
    Brindes: "Item personalizado para ações promocionais, relacionamento com clientes e lembranças de marca.",
  };
  return descriptions[category] || `${name} personalizado produzido pela Alcateia's Produções Gráficas.`;
}

async function ellaLocalFallback({
  message,
  supabase,
  userId,
}: {
  message: string;
  supabase: any;
  userId: string;
}) {
  const text = message.trim();
  const normalized = normalizeText(text);
  const toolActivity: Array<{ name: string; input: any; output: any }> = [];

  const pushTool = (name: string, input: any, output: any) => {
    toolActivity.push({ name, input, output });
    return output;
  };

  if (/panorama|resumo|dashboard|faturamento|ativas|pendentes/.test(normalized)) {
    const [ordersRes, recRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id,production_status,total,paid,created_at")
        .not("production_status", "in", "(entregue,cancelado)"),
      supabase.from("receivables").select("amount,status").eq("status", "pendente"),
    ]);
    if (ordersRes.error) return { response: `Não consegui consultar OS: ${ordersRes.error.message}`, toolActivity };
    if (recRes.error) return { response: `Não consegui consultar cobranças: ${recRes.error.message}`, toolActivity };
    const activeOrders = ordersRes.data?.length ?? 0;
    const pendingReceivables =
      recRes.data?.reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0) ?? 0;
    pushTool("dashboard_summary", {}, { activeOrders, pendingReceivables });
    return {
      response: `Estou em modo Vercel básico, mas consegui consultar: ${activeOrders} OS ativas e R$ ${pendingReceivables.toFixed(2)} em cobranças pendentes.`,
      toolActivity,
    };
  }

  if (/os|ordem|pedido/.test(normalized) && /listar|liste|producao|produção|ativas/.test(normalized)) {
    const { data, error } = await supabase
      .from("orders")
      .select("number,title,total,production_status,deadline,clients(name)")
      .not("production_status", "in", "(entregue,cancelado)")
      .order("created_at", { ascending: false })
      .limit(10);
    pushTool("list_orders", { limit: 10 }, error ? { error: error.message } : { orders: data ?? [] });
    if (error) return { response: `Não consegui listar as OS: ${error.message}`, toolActivity };
    const lines = (data ?? [])
      .map((order: any) => `#${order.number} - ${order.title || "OS"} (${order.production_status})`)
      .join("\n");
    return { response: lines ? `OS ativas:\n${lines}` : "Não encontrei OS ativas.", toolActivity };
  }

  const priceMatch = text.match(/(?:preco|preço|valor).+?(?:de|do|da)\s+(.+?)\s+(?:para|por)\s+r?\$?\s*([\d.,]+)/i);
  if (priceMatch) {
    const name = priceMatch[1].trim();
    const newPrice = toNumber(priceMatch[2]);
    const { data: found } = await supabase
      .from("services")
      .select("id,name")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (!found) return { response: `Não encontrei "${name}" no catálogo.`, toolActivity };
    const { error } = await supabase.from("services").update({ base_price: newPrice }).eq("id", found.id);
    pushTool("update_service_price", { name, newPrice }, error ? { error: error.message } : { success: true });
    return {
      response: error
        ? `Não consegui atualizar o preço: ${error.message}`
        : `Pronto. Atualizei "${found.name}" para R$ ${newPrice.toFixed(2)}.`,
      toolActivity,
    };
  }

  const createProductMatch = text.match(
    /(?:crie|criar|cadastre|cadastrar|adicione|adicionar)\s+(?:um\s+|uma\s+)?(?:produto|servico|serviço)?\s*([^,.]+?)(?:\s+(?:por|preco|preço|valor)\s*r?\$?\s*([\d.,]+))?(?:,|\s|$)/i,
  );
  if (createProductMatch && /(produto|servico|serviço|preco|preço|valor)/i.test(text)) {
    const name = createProductMatch[1].trim();
    const category = inferCategory(name);
    const description = buildServiceDescription(name, category);
    const payload = {
      name,
      category,
      description,
      short_description: description,
      base_price: toNumber(createProductMatch[2] ?? 0),
      unit: "un",
      image_url: imagePathFor(category, name),
      active: true,
    };
    const { data, error } = await supabase
      .from("services")
      .insert(payload)
      .select("id,name,category,base_price")
      .single();
    pushTool("create_service", payload, error ? { error: error.message } : { service: data });
    return {
      response: error
        ? `Não consegui criar o produto/serviço: ${error.message}`
        : `Pronto. Criei "${name}" no catálogo em ${category}.`,
      toolActivity,
    };
  }

  const quantityMatch = normalized.match(
    /(?:adicione|adicionar|dar entrada|entrada|coloque|ajuste|ajustar|atualize|atualizar)\s+(\d+(?:[,.]\d+)?)\s+(?:unidades?\s+de\s+|un\s+de\s+|de\s+)?(.+?)(?:\s+(?:no|na|em)\s+estoque)?$/i,
  );
  if (quantityMatch && /estoque|entrada|adicione|adicionar|ajuste|atualize|atualizar|coloque/.test(normalized)) {
    const quantity = toNumber(quantityMatch[1]);
    const name = quantityMatch[2].replace(/\s+(no|na|em)\s+estoque$/i, "").trim();
    const operation = /ajuste|ajustar|atualize|atualizar/.test(normalized) ? "ajuste" : "entrada";
    const found = await supabase
      .from("inventory_items" as any)
      .select("*")
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();
    if (found.error) return { response: `Não consegui consultar o estoque: ${found.error.message}`, toolActivity };
    if (!found.data) {
      const inserted = await supabase
        .from("inventory_items" as any)
        .insert({
          name,
          unit: "un",
          current_quantity: quantity,
          min_quantity: 0,
          cost_price: 0,
          notes: "Criado pela Ella",
          active: true,
          created_by: userId,
        })
        .select("id,name,current_quantity")
        .single();
      pushTool("create_inventory_item", { name, quantity }, inserted.error ? { error: inserted.error.message } : inserted.data);
      return {
        response: inserted.error
          ? `Não consegui criar o item no estoque: ${inserted.error.message}`
          : `Pronto. Criei "${name}" no estoque com ${quantity} unidades.`,
        toolActivity,
      };
    }
    const item = found.data as any;
    const previous = Number(item.current_quantity || 0);
    const next = operation === "entrada" ? previous + quantity : quantity;
    const updated = await supabase
      .from("inventory_items" as any)
      .update({ current_quantity: next })
      .eq("id", item.id);
    if (!updated.error) {
      await supabase.from("inventory_movements" as any).insert({
        inventory_item_id: item.id,
        type: operation,
        quantity: Math.abs(next - previous),
        previous_quantity: previous,
        new_quantity: next,
        reason: "Pedido feito no chat da Ella",
        reference: "Ella",
        created_by: userId,
      });
    }
    pushTool("update_inventory_quantity", { name, quantity, operation }, updated.error ? { error: updated.error.message } : { previous, next });
    return {
      response: updated.error
        ? `Não consegui atualizar o estoque: ${updated.error.message}`
        : `Pronto. Atualizei "${item.name}" de ${previous} para ${next}.`,
      toolActivity,
    };
  }

  return {
    response:
      "Estou funcionando na Vercel em modo básico. Para a Ella completa com IA, áudio e análise de anexos, configure LOVABLE_API_KEY na Vercel. Mesmo assim, já consigo executar comandos simples como atualizar preço, criar produto, listar OS e mexer no estoque.",
    toolActivity,
  };
}

export const ellaChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => InputSchema.parse(v))
  .handler(async ({ data, context }) => {
    const resolved = resolveEllaModel();
    const supabase = context.supabase;
    const userId = context.userId;

    if (!resolved) {
      const fallback = await ellaLocalFallback({
        message: data.message,
        supabase,
        userId,
      });
      return {
        ...fallback,
        trace_id: "local-fallback",
      };
    }

    const { model, modelName, provider } = resolved;
    const traceId = newTraceId();
    const startedAt = Date.now();

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
      list_art_proofs: tool({
        description:
          "Lista as artes enviadas para aprovação do cliente, com status (pendente/aprovado/reprovado), cliente e link público.",
        inputSchema: z.object({
          status: z.enum(["pendente", "aprovado", "reprovado"]).optional(),
          clientName: z.string().optional(),
        }),
        execute: async ({ status, clientName }) => {
          let q = supabase
            .from("art_proofs")
            .select("id,token,title,status,client_feedback,viewed_at,created_at,clients(name)")
            .order("created_at", { ascending: false })
            .limit(20);
          if (status) q = q.eq("status", status);
          const { data, error } = await q;
          if (error) return { error: error.message };
          let rows = data ?? [];
          if (clientName) {
            const needle = normalizeText(clientName);
            rows = rows.filter((r: any) => normalizeText(r.clients?.name).includes(needle));
          }
          return {
            proofs: rows.map((r: any) => ({
              title: r.title,
              client: r.clients?.name ?? null,
              status: r.status,
              feedback: r.client_feedback,
              viewed: Boolean(r.viewed_at),
              link: `/arte/${r.token}`,
            })),
          };
        },
      }),
      update_art_proof: tool({
        description:
          "Atualiza uma arte de aprovação pelo título: pode reabrir para nova resposta (reset=true) ou trocar a observação enviada ao cliente.",
        inputSchema: z.object({
          title: z.string(),
          reset: z.boolean().optional(),
          note: z.string().optional(),
        }),
        execute: async ({ title, reset, note }) => {
          const { data: found } = await supabase
            .from("art_proofs")
            .select("id,title")
            .ilike("title", `%${title}%`)
            .limit(1)
            .maybeSingle();
          if (!found) return { error: `Não encontrei a arte "${title}".` };
          const patch: {
            note?: string;
            status?: "pendente";
            client_feedback?: string | null;
            responded_at?: string | null;
          } = {};
          if (note !== undefined) patch.note = note;
          if (reset) {
            patch.status = "pendente";
            patch.client_feedback = null;
            patch.responded_at = null;
          }
          const { error } = await supabase.from("art_proofs").update(patch).eq("id", found.id);
          if (error) return { error: error.message };
          return { success: true, title: found.title };
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
      update_client: tool({
        description: "Atualiza dados de um cliente pelo id.",
        inputSchema: z.object({
          id: z.string().uuid(),
          name: z.string().optional(),
          whatsapp: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ id, ...rest }) => {
          const patch: any = {};
          for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
          const { error } = await supabase.from("clients").update(patch).eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      delete_client: tool({
        description: "Exclui um cliente pelo id. Ação destrutiva — só use após confirmação.",
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => {
          const { error } = await supabase.from("clients").delete().eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      cancel_order: tool({
        description: "Cancela uma OS pelo número (marca como 'cancelado').",
        inputSchema: z.object({ number: z.number(), reason: z.string().optional() }),
        execute: async ({ number, reason }) => {
          const { data, error } = await supabase
            .from("orders")
            .update({
              production_status: "cancelado",
              current_activity: reason ? `Cancelado: ${reason}` : "Cancelado",
            })
            .eq("number", number)
            .select("number")
            .maybeSingle();
          if (error) return { error: error.message };
          if (!data) return { error: `OS #${number} não encontrada` };
          return { success: true };
        },
      }),
      delete_receivable: tool({
        description: "Exclui uma cobrança pelo id. Ação destrutiva.",
        inputSchema: z.object({ id: z.string().uuid() }),
        execute: async ({ id }) => {
          const { error } = await supabase.from("receivables").delete().eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      update_receivable: tool({
        description: "Atualiza valor, vencimento ou status de uma cobrança.",
        inputSchema: z.object({
          id: z.string().uuid(),
          amount: z.number().optional(),
          dueDate: z.string().optional().describe("YYYY-MM-DD"),
          status: z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ id, dueDate, ...rest }) => {
          const patch: any = {};
          for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
          if (dueDate) patch.due_date = dueDate;
          const { error } = await supabase.from("receivables").update(patch).eq("id", id);
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      list_users: tool({
        description: "Lista usuários do sistema com seus papéis.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id,full_name,email")
            .order("full_name");
          if (error) return { error: error.message };
          const { data: roles } = await supabase.from("user_roles").select("user_id,role");
          const byUser: Record<string, string[]> = {};
          for (const r of roles ?? []) {
            (byUser[r.user_id] ??= []).push(r.role);
          }
          return {
            users: (profiles ?? []).map((p: any) => ({ ...p, roles: byUser[p.id] ?? [] })),
          };
        },
      }),
      set_user_role: tool({
        description:
          "Define o papel de um usuário. role em: administrador, atendente, producao, financeiro.",
        inputSchema: z.object({
          userId: z.string().uuid(),
          role: z.enum(["administrador", "atendente", "producao", "financeiro"]),
          replaceExisting: z.boolean().optional(),
        }),
        execute: async ({ userId: uid, role, replaceExisting }) => {
          if (replaceExisting) {
            await supabase.from("user_roles").delete().eq("user_id", uid);
          }
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: uid, role })
            .select("id")
            .maybeSingle();
          if (error) return { error: error.message };
          return { success: true };
        },
      }),
      create_service: tool({
        description:
          "Cria um produto/serviço no catálogo. Categoria obrigatória (ex.: Cartões, Banners, Adesivos). unit padrão 'un'.",
        inputSchema: z.object({
          name: z.string(),
          category: z.string(),
          base_price: z.number(),
          unit: z.string().optional(),
          description: z.string().optional(),
          short_description: z.string().optional(),
          default_deadline_days: z.number().optional(),
          min_quantity: z.number().optional(),
          badge: z.string().optional(),
          slug: z.string().optional(),
          image_url: z.string().optional(),
          active: z.boolean().optional(),
        }),
        execute: async (input) => {
          const { data, error } = await supabase
            .from("services")
            .insert({ ...input })
            .select("id,name,category,base_price")
            .single();
          if (error) return { error: error.message };
          return { success: true, service: data };
        },
      }),
      update_service: tool({
        description:
          "Atualiza um produto/serviço. Localize pelo id OU pelo nome (busca aproximada).",
        inputSchema: z.object({
          id: z.string().uuid().optional(),
          name_query: z.string().optional(),
          name: z.string().optional(),
          category: z.string().optional(),
          base_price: z.number().optional(),
          unit: z.string().optional(),
          description: z.string().optional(),
          short_description: z.string().optional(),
          default_deadline_days: z.number().optional(),
          min_quantity: z.number().optional(),
          badge: z.string().optional(),
          image_url: z.string().optional(),
          active: z.boolean().optional(),
        }),
        execute: async ({ id, name_query, ...rest }) => {
          let sid = id;
          if (!sid && name_query) {
            const { data: found } = await supabase
              .from("services")
              .select("id")
              .ilike("name", `%${name_query}%`)
              .limit(1)
              .maybeSingle();
            sid = found?.id;
          }
          if (!sid) return { error: "Produto não localizado." };
          const patch: any = {};
          for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
          const { error } = await supabase.from("services").update(patch).eq("id", sid);
          if (error) return { error: error.message };
          return { success: true, id: sid };
        },
      }),
      delete_service: tool({
        description:
          "Remove um produto/serviço. Ação destrutiva — confirme antes. Use soft delete (active=false) quando o produto já foi usado em OS.",
        inputSchema: z.object({
          id: z.string().uuid().optional(),
          name_query: z.string().optional(),
          soft: z.boolean().optional(),
        }),
        execute: async ({ id, name_query, soft }) => {
          let sid = id;
          if (!sid && name_query) {
            const { data: found } = await supabase
              .from("services")
              .select("id")
              .ilike("name", `%${name_query}%`)
              .limit(1)
              .maybeSingle();
            sid = found?.id;
          }
          if (!sid) return { error: "Produto não localizado." };
          if (soft) {
            const { error } = await supabase
              .from("services")
              .update({ active: false })
              .eq("id", sid);
            if (error) return { error: error.message };
            return { success: true, mode: "soft" };
          }
          const { error } = await supabase.from("services").delete().eq("id", sid);
          if (error) {
            // Fallback pra soft se houver FK
            await supabase.from("services").update({ active: false }).eq("id", sid);
            return { success: true, mode: "soft_fallback", note: error.message };
          }
          return { success: true, mode: "hard" };
        },
      }),
      add_cash_entry: tool({
        description:
          "Lança entrada ou saída no caixa. type='entrada' (recebimento) ou 'saida' (despesa). Opcional vincular a order/receivable.",
        inputSchema: z.object({
          type: z.enum(["entrada", "saida"]),
          amount: z.number().positive(),
          description: z.string(),
          category: z.string().optional(),
          payment_method: z
            .enum(["dinheiro", "pix", "credito", "debito", "boleto", "transferencia", "outro"])
            .optional(),
          entry_date: z.string().optional().describe("YYYY-MM-DD — padrão: hoje"),
          orderNumber: z.number().optional(),
          clientName: z.string().optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ type, amount, description, category, payment_method, entry_date, orderNumber, clientName, notes }) => {
          let order_id: string | null = null;
          let client_id: string | null = null;
          if (orderNumber) {
            const { data: o } = await supabase
              .from("orders")
              .select("id,client_id")
              .eq("number", orderNumber)
              .maybeSingle();
            if (o) {
              order_id = o.id;
              client_id = o.client_id;
            }
          }
          if (!client_id && clientName) {
            client_id = await resolveClientId(supabase, null, clientName);
          }
          const { data, error } = await supabase
            .from("cash_entries")
            .insert({
              type,
              amount,
              description,
              category,
              payment_method,
              entry_date: entry_date ?? new Date().toISOString().slice(0, 10),
              order_id,
              client_id,
              notes,
              created_by: userId,
            })
            .select("id,type,amount,entry_date")
            .single();
          if (error) return { error: error.message };
          return { success: true, entry: data };
        },
      }),
      list_cash_entries: tool({
        description: "Lista lançamentos de caixa de um período. Padrão: hoje.",
        inputSchema: z.object({
          from: z.string().optional().describe("YYYY-MM-DD"),
          to: z.string().optional().describe("YYYY-MM-DD"),
          type: z.enum(["entrada", "saida"]).optional(),
        }),
        execute: async ({ from, to, type }) => {
          const today = new Date().toISOString().slice(0, 10);
          let q = supabase
            .from("cash_entries")
            .select(
              "id,type,amount,description,category,payment_method,entry_date,clients(name),orders(number)",
            )
            .gte("entry_date", from ?? today)
            .lte("entry_date", to ?? from ?? today)
            .order("created_at", { ascending: false });
          if (type) q = q.eq("type", type);
          const { data, error } = await q.limit(100);
          if (error) return { error: error.message };
          return { entries: data ?? [] };
        },
      }),
      cash_status: tool({
        description:
          "Panorama do caixa do dia: total de entradas, saídas, saldo, e se o dia já foi fechado.",
        inputSchema: z.object({ date: z.string().optional().describe("YYYY-MM-DD — padrão: hoje") }),
        execute: async ({ date }) => {
          const day = date ?? new Date().toISOString().slice(0, 10);
          const [entriesRes, closureRes] = await Promise.all([
            supabase
              .from("cash_entries")
              .select("type,amount,payment_method")
              .eq("entry_date", day),
            supabase.from("cash_closures").select("*").eq("closure_date", day).maybeSingle(),
          ]);
          const entries = entriesRes.data ?? [];
          const total_in = entries
            .filter((e: any) => e.type === "entrada")
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          const total_out = entries
            .filter((e: any) => e.type === "saida")
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          const by_method: Record<string, number> = {};
          for (const e of entries) {
            const k = e.payment_method ?? "outro";
            const sign = e.type === "entrada" ? 1 : -1;
            by_method[k] = (by_method[k] ?? 0) + sign * Number(e.amount);
          }
          return {
            date: day,
            total_in,
            total_out,
            balance: total_in - total_out,
            entries_count: entries.length,
            by_method,
            closed: !!closureRes.data,
            closure: closureRes.data ?? null,
          };
        },
      }),
      close_cash: tool({
        description:
          "Fecha o caixa de um dia. Informe o dinheiro contado; o sistema calcula a diferença vs esperado.",
        inputSchema: z.object({
          date: z.string().optional().describe("YYYY-MM-DD — padrão: hoje"),
          initial_amount: z.number().default(0),
          counted_cash: z.number(),
          notes: z.string().optional(),
        }),
        execute: async ({ date, initial_amount, counted_cash, notes }) => {
          const day = date ?? new Date().toISOString().slice(0, 10);
          const { data: existing } = await supabase
            .from("cash_closures")
            .select("id")
            .eq("closure_date", day)
            .maybeSingle();
          if (existing) return { error: `Caixa do dia ${day} já foi fechado.` };
          const { data: entries } = await supabase
            .from("cash_entries")
            .select("type,amount,payment_method")
            .eq("entry_date", day);
          const rows = entries ?? [];
          const total_in = rows
            .filter((e: any) => e.type === "entrada")
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          const total_out = rows
            .filter((e: any) => e.type === "saida")
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          const by_method: Record<string, number> = {};
          for (const e of rows) {
            const k = e.payment_method ?? "outro";
            const sign = e.type === "entrada" ? 1 : -1;
            by_method[k] = (by_method[k] ?? 0) + sign * Number(e.amount);
          }
          const cashIn = rows
            .filter((e: any) => e.type === "entrada" && (e.payment_method ?? "dinheiro") === "dinheiro")
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          const cashOut = rows
            .filter((e: any) => e.type === "saida" && (e.payment_method ?? "dinheiro") === "dinheiro")
            .reduce((s: number, e: any) => s + Number(e.amount), 0);
          const expected_cash = initial_amount + cashIn - cashOut;
          const difference = counted_cash - expected_cash;
          const { data, error } = await supabase
            .from("cash_closures")
            .insert({
              closure_date: day,
              closed_at: new Date().toISOString(),
              initial_amount,
              expected_cash,
              counted_cash,
              difference,
              total_in,
              total_out,
              by_method,
              entries_count: rows.length,
              notes,
              created_by: userId,
            })
            .select("id,closure_date,expected_cash,counted_cash,difference,total_in,total_out")
            .single();
          if (error) return { error: error.message };
          return { success: true, closure: data };
        },
      }),
      create_pdv_sale: tool({
        description:
          "Registra uma venda no PDV: cria OS com os itens, marca como paga se payment=total, e lança entrada no caixa. Ideal para venda balcão.",
        inputSchema: z.object({
          clientId: z.string().uuid().optional(),
          clientName: z.string().optional(),
          items: z
            .array(
              z.object({
                description: z.string(),
                quantity: z.number().default(1),
                unit_price: z.number(),
              }),
            )
            .min(1),
          payment_method: z
            .enum(["dinheiro", "pix", "credito", "debito", "boleto", "transferencia", "outro"])
            .default("dinheiro"),
          amount_paid: z.number().optional().describe("Se omitido, considera total."),
          notes: z.string().optional(),
        }),
        execute: async ({ clientId, clientName, items, payment_method, amount_paid, notes }) => {
          const cId = await resolveClientId(supabase, clientId, clientName);
          if (!cId) return { error: "Cliente não localizado. Crie primeiro com create_client." };
          const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
          const paid = amount_paid ?? total;
          const { data: order, error } = await supabase
            .from("orders")
            .insert({
              client_id: cId,
              title: "Venda balcão",
              total,
              paid,
              payment_method,
              production_status: paid >= total ? "entregue" : "pronto_para_retirada",
              created_by: userId,
              attendant_id: userId,
              client_notes: notes,
            })
            .select("id,number,total,paid")
            .single();
          if (error) return { error: error.message };
          const rows = items.map((i) => ({
            order_id: order.id,
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.quantity * i.unit_price,
          }));
          const { error: itemsErr } = await supabase.from("order_items").insert(rows);
          if (itemsErr) return { error: itemsErr.message };
          if (paid > 0) {
            await supabase.from("cash_entries").insert({
              type: "entrada",
              amount: paid,
              description: `PDV #${order.number}`,
              category: "venda",
              payment_method,
              entry_date: new Date().toISOString().slice(0, 10),
              order_id: order.id,
              client_id: cId,
              created_by: userId,
            });
          }
          return { success: true, sale: { order_number: order.number, total, paid, payment_method } };
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

    // Processa anexos: áudio vira transcrição; imagem/PDF/vídeo viram partes multimodais.
    const attachments = data.attachments ?? [];
    let userText = data.message;
    const mediaParts: any[] = [];
    for (const att of attachments) {
      const mt = att.mimeType.toLowerCase();
      if (mt.startsWith("audio/")) {
        // A transcrição continua no gateway da Lovable (Gemini não expõe /audio/transcriptions aqui).
        const transcribeKey = process.env.LOVABLE_API_KEY;
        const transcript = transcribeKey ? await transcribeAttachment(transcribeKey, att) : "";
        userText += transcript
          ? `\n\n[Áudio "${att.name}" — transcrição]: ${transcript}`
          : `\n\n[Áudio "${att.name}" enviado mas não foi possível transcrever.]`;
      } else if (mt.startsWith("image/")) {
        mediaParts.push({
          type: "image" as const,
          image: `data:${att.mimeType};base64,${att.dataBase64}`,
        });
      } else {
        mediaParts.push({
          type: "file" as const,
          data: `data:${att.mimeType};base64,${att.dataBase64}`,
          mediaType: att.mimeType,
          filename: att.name,
        });
      }
    }

    const userMessage: any = mediaParts.length
      ? { role: "user", content: [{ type: "text", text: userText }, ...mediaParts] }
      : { role: "user", content: userText };

    try {
      const result = await generateText({
        model,
        system: `${ADMIN_SYSTEM_PROMPT}\n\nData/hora atual (America/Sao_Paulo): ${today}${kbBlock}`,
        messages: [...history, userMessage],
        tools,
        stopWhen: stepCountIs(50),
        abortSignal: aiTimeoutSignal(60_000),
      });

      const toolActivity: Array<{ name: string; input: any; output: any }> = [];
      for (const step of result.steps ?? []) {
        for (const tc of step.toolCalls ?? []) {
          const tr = step.toolResults?.find((r: any) => r.toolCallId === tc.toolCallId);
          toolActivity.push({ name: tc.toolName, input: tc.input, output: tr?.output ?? null });
        }
      }

      logAiEvent({
        provider,
        model: modelName,
        endpoint: "/ella",
        trace_id: traceId,
        status: "success",
        duration_ms: Date.now() - startedAt,
        user_id: userId,
        extra: { tool_calls: toolActivity.length },
      });
      return { response: result.text || "Feito.", toolActivity, trace_id: traceId };
    } catch (err: any) {
      const cls = classifyAiError(err);
      console.error("ellaChat error:", traceId, cls);
      logAiEvent({
        provider,
        model: modelName,
        endpoint: "/ella",
        trace_id: traceId,
        status: "error",
        duration_ms: Date.now() - startedAt,
        user_id: userId,
        ...cls,
      });
      return {
        response:
          "Tive um problema ao processar agora. Se o erro persistir, me diga o que estava tentando fazer que eu tento outro caminho.",
        toolActivity: [],
        error: cls.error_message,
        trace_id: traceId,
      };
    }
  });
