// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPT = `Você é Ella Ribeiro, assistente administrativa da Alcateia's Produções Gráficas.
Você ajuda o administrador a operar o sistema com linguagem direta e profissional.

Você pode consultar e executar ações em clientes, catálogo, ordens de serviço e caixa usando as ferramentas disponíveis.
Nunca invente que uma ação foi concluída: só confirme depois que a ferramenta retornar sucesso.
Antes de uma alteração destrutiva, ambígua ou financeira, apresente claramente o que será feito e peça os dados que faltarem.
Não exclua registros. Para alterações de status, preços e lançamentos financeiros, repita na resposta os valores alterados.
Responda sempre em Português Brasileiro.`;

const tools = [
  tool("list_services", "Lista produtos e serviços do catálogo", {}),
  tool(
    "add_service",
    "Cadastra um produto ou serviço",
    {
      name: stringField("Nome"),
      category: stringField("Categoria"),
      base_price: numberField("Preço"),
      description: stringField("Descrição opcional"),
    },
    ["name", "category", "base_price"],
  ),
  tool(
    "update_service",
    "Atualiza preço, nome, categoria, descrição ou disponibilidade de um produto",
    {
      service_identifier: stringField("Nome ou ID"),
      name: stringField("Novo nome"),
      category: stringField("Nova categoria"),
      base_price: numberField("Novo preço"),
      description: stringField("Nova descrição"),
      active: { type: "boolean" },
    },
    ["service_identifier"],
  ),
  tool(
    "create_client",
    "Cadastra um cliente",
    {
      name: stringField("Nome"),
      whatsapp: stringField("WhatsApp"),
      email: stringField("E-mail"),
      notes: stringField("Observações"),
    },
    ["name"],
  ),
  tool("list_clients", "Pesquisa clientes por nome ou WhatsApp", {
    search: stringField("Busca opcional"),
  }),
  tool("list_orders", "Lista ordens de serviço recentes ou por status", {
    status: stringField("Status opcional"),
  }),
  tool(
    "create_order",
    "Cria uma ordem de serviço simples para um cliente existente",
    {
      client_id: stringField("ID do cliente"),
      title: stringField("Título"),
      description: stringField("Descrição"),
      total: numberField("Valor total"),
      deadline: stringField("Prazo YYYY-MM-DD"),
      production_status: stringField("Status de produção"),
    },
    ["client_id", "title", "total"],
  ),
  tool(
    "update_order_status",
    "Atualiza status, atividade, progresso ou responsável textual de uma OS",
    {
      order_identifier: stringField("ID ou número da OS"),
      production_status: stringField("Novo status"),
      current_activity: stringField("Atividade atual"),
      progress: numberField("Progresso de 0 a 100"),
      assignee_name: stringField("Nome do responsável"),
    },
    ["order_identifier"],
  ),
  tool(
    "register_cash_entry",
    "Registra entrada ou saída no caixa",
    {
      type: { type: "string", enum: ["entrada", "saida"] },
      description: stringField("Descrição"),
      amount: numberField("Valor"),
      payment_method: stringField("Forma de pagamento"),
      category: stringField("Categoria"),
      notes: stringField("Observações"),
    },
    ["type", "description", "amount"],
  ),
  tool("get_daily_cash_summary", "Consulta entradas, saídas e saldo do caixa de hoje", {}),
] as any[];

function stringField(description: string) {
  return { type: "string", description };
}
function numberField(description: string) {
  return { type: "number", description };
}
function tool(
  name: string,
  description: string,
  properties: Record<string, any>,
  required: string[] = [],
) {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: { type: "object", properties, required, additionalProperties: false },
    },
  };
}

export const getEllaHistory = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any)
    .from("ella_chat_history")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(50);
  return data ?? [];
});

export const chatWithElla = createServerFn({ method: "POST" })
  .inputValidator(z.object({ message: z.string().min(1).max(4000), userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { OpenAI } = await import("openai");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    await db
      .from("ella_chat_history")
      .insert({ user_id: data.userId, role: "user", content: data.message });
    const { data: history } = await db
      .from("ella_chat_history")
      .select("role, content")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(12);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE || undefined,
    });
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history ?? []).reverse().map((item: any) => ({ role: item.role, content: item.content })),
    ];
    let response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages,
      tools,
    });
    let assistantMessage = response.choices[0]?.message;

    if (assistantMessage?.tool_calls?.length) {
      const toolMessages: any[] = [...messages, assistantMessage];
      for (const call of assistantMessage.tool_calls) {
        let args: any = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        const result = await executeTool(db, call.function.name, args);
        toolMessages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        await db
          .from("ella_actions_log")
          .insert({
            user_id: data.userId,
            action_type: call.function.name,
            details: args,
            status: result.ok ? "success" : "error",
          });
      }
      response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: toolMessages,
      });
      assistantMessage = response.choices[0]?.message;
    }

    const content =
      assistantMessage?.content ||
      "A ação foi processada, mas não consegui gerar uma resposta textual.";
    await db.from("ella_chat_history").insert({ user_id: data.userId, role: "assistant", content });
    return { message: content };
  });

async function executeTool(db: any, name: string, args: any) {
  try {
    if (name === "list_services") {
      const { data, error } = await db
        .from("services")
        .select("id,name,category,base_price,active")
        .order("name")
        .limit(50);
      return result(data, error);
    }
    if (name === "add_service") {
      const { data, error } = await db
        .from("services")
        .insert({
          name: args.name,
          category: args.category,
          base_price: args.base_price,
          description: args.description || null,
        })
        .select("id,name,base_price")
        .single();
      return result(data, error);
    }
    if (name === "update_service") {
      const match = await findService(db, args.service_identifier);
      if (!match) return { ok: false, error: "Produto ou serviço não encontrado." };
      const patch = pick(args, ["name", "category", "base_price", "description", "active"]);
      const { data, error } = await db
        .from("services")
        .update(patch)
        .eq("id", match.id)
        .select("id,name,category,base_price,active")
        .single();
      return result(data, error);
    }
    if (name === "create_client") {
      const { data, error } = await db
        .from("clients")
        .insert({
          name: args.name,
          whatsapp: args.whatsapp || null,
          email: args.email || null,
          notes: args.notes || null,
        })
        .select("id,name,whatsapp")
        .single();
      return result(data, error);
    }
    if (name === "list_clients") {
      let query = db.from("clients").select("id,name,whatsapp,email").order("name").limit(30);
      if (args.search)
        query = query.or(
          `name.ilike.%${escapeFilter(args.search)}%,whatsapp.ilike.%${escapeFilter(args.search)}%`,
        );
      const { data, error } = await query;
      return result(data, error);
    }
    if (name === "list_orders") {
      let query = db
        .from("orders")
        .select(
          "id,number,title,total,paid,production_status,current_activity,progress,deadline,clients(name)",
        )
        .order("created_at", { ascending: false })
        .limit(30);
      if (args.status) query = query.eq("production_status", args.status);
      const { data, error } = await query;
      return result(data, error);
    }
    if (name === "create_order") {
      const { data, error } = await db
        .from("orders")
        .insert({
          client_id: args.client_id,
          title: args.title,
          description: args.description || null,
          total: args.total,
          deadline: args.deadline || null,
          production_status: args.production_status || "aguardando_arte",
        })
        .select("id,number,title,total,production_status")
        .single();
      return result(data, error);
    }
    if (name === "update_order_status") {
      const order = await findOrder(db, args.order_identifier);
      if (!order) return { ok: false, error: "Ordem de serviço não encontrada." };
      const patch = pick(args, [
        "production_status",
        "current_activity",
        "progress",
        "assignee_name",
      ]);
      if (Object.keys(patch).length === 0)
        return { ok: false, error: "Nenhuma alteração foi informada." };
      patch.updated_at = new Date().toISOString();
      if (patch.progress !== undefined)
        patch.progress = Math.max(0, Math.min(100, Number(patch.progress)));
      const { data, error } = await db
        .from("orders")
        .update(patch)
        .eq("id", order.id)
        .select("id,number,title,production_status,current_activity,progress,assignee_name")
        .single();
      return result(data, error);
    }
    if (name === "register_cash_entry") {
      if (Number(args.amount) <= 0) return { ok: false, error: "O valor deve ser maior que zero." };
      const { data, error } = await db
        .from("cash_entries")
        .insert({
          type: args.type,
          description: args.description,
          amount: args.amount,
          entry_date: new Date().toISOString().slice(0, 10),
          payment_method: args.payment_method || null,
          category: args.category || "Lançamento pela Ella",
          notes: args.notes || null,
        })
        .select("id,type,description,amount,payment_method")
        .single();
      return result(data, error);
    }
    if (name === "get_daily_cash_summary") {
      const date = new Date().toISOString().slice(0, 10);
      const { data, error } = await db
        .from("cash_entries")
        .select("type,amount,payment_method")
        .eq("entry_date", date);
      if (error) return result(null, error);
      const entries = data ?? [];
      const income = entries
        .filter((item: any) => item.type === "entrada")
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      const expense = entries
        .filter((item: any) => item.type === "saida")
        .reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      return {
        ok: true,
        data: { date, income, expense, balance: income - expense, transactions: entries.length },
      };
    }
    return { ok: false, error: "Ação não reconhecida." };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Erro inesperado." };
  }
}

async function findService(db: any, identifier: string) {
  const byId = await db.from("services").select("id").eq("id", identifier).maybeSingle();
  if (byId.data) return byId.data;
  const byName = await db
    .from("services")
    .select("id")
    .ilike("name", `%${escapeFilter(identifier)}%`)
    .limit(1)
    .maybeSingle();
  return byName.data;
}

async function findOrder(db: any, identifier: string) {
  const byId = await db.from("orders").select("id").eq("id", identifier).maybeSingle();
  if (byId.data) return byId.data;
  const number = Number(String(identifier).replace(/\D/g, ""));
  if (!number) return null;
  const byNumber = await db.from("orders").select("id").eq("number", number).maybeSingle();
  return byNumber.data;
}

function pick(source: any, keys: string[]) {
  return Object.fromEntries(
    keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]),
  );
}
function escapeFilter(value: string) {
  return String(value)
    .replace(/[,%()]/g, " ")
    .trim();
}
function result(data: any, error: any) {
  return error ? { ok: false, error: error.message } : { ok: true, data };
}
