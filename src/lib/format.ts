export const DEFAULT_COMPANY_DOCUMENT = "";

export const brl = (n: number | string | null | undefined) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Converte uma data local em YYYY-MM-DD sem passar por UTC.
 * Datas de negócio vindas de inputs type="date" devem permanecer como date-only.
 */
export const toIsoDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Interpreta YYYY-MM-DD no fuso local, sem o deslocamento implícito de new Date(string). */
export const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addIsoDays = (value: string, days: number) => {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  if (typeof d === "string") {
    const value = d.trim();
    if (!value) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return parseDateOnly(value).toLocaleDateString("pt-BR");
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
  }
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
};

export const fmtDateOnly = (value: string | null | undefined) => {
  const raw = value?.trim() ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return fmtDate(value);
};

export const fmtDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
};

export const fmtCnpj = (value: string | null | undefined) => {
  const raw = (value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 14) return raw || "—";
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const PRODUCTION_STATUS_LABEL: Record<string, string> = {
  orcamento: "Orçamento",
  aguardando_aprovacao: "Aguardando aprovação",
  aguardando_arte: "Aguardando arte",
  arte_em_criacao: "Arte em criação",
  aguardando_pagamento: "Aguardando pagamento",
  aprovado: "Aprovado",
  em_producao: "Em produção",
  pausado: "Pausado",
  pronto_para_retirada: "Pronto para retirada",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  nao_pago: "Não pago",
  sinal_pago: "Sinal pago",
  pago_parcial: "Pago parcial",
  pago_completo: "Pago completo",
  em_atraso: "Em atraso",
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  em_analise: "Em análise",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const SERVICE_CATEGORIES = [
  "Banners acadêmicos",
  "Banners personalizados",
  "Adesivos",
  "Adesivos para vidro",
  "Cartões de visita",
  "Canecas personalizadas",
  "DTF",
  "Camisetas",
  "Placas",
  "Sinalização",
  "Impressão 3D",
  "Impressões grandes",
  "Personalizados",
  "Outros",
];

export const PAYMENT_METHODS = [
  "Dinheiro",
  "Pix",
  "Cartão de débito",
  "Cartão de crédito",
  "Boleto",
  "Transferência",
  "Outro",
];

export const CASH_IN_CATEGORIES = [
  "Venda de serviço",
  "Pagamento de OS",
  "Sinal/Entrada",
  "Outros",
];
export const CASH_OUT_CATEGORIES = [
  "Material",
  "Aluguel",
  "Energia",
  "Internet",
  "Funcionário",
  "Fornecedor",
  "Manutenção",
  "Equipamento",
  "Transporte",
  "Outros",
];
