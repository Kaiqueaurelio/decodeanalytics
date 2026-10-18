// Shared tokens for the Decode Analytics service catalogue.
export const STORE_CATEGORIES = [
  { slug: "todos", label: "Todas as soluções" },
  { slug: "Dados & Business Intelligence", label: "Dados & BI" },
  { slug: "Desenvolvimento Web", label: "Desenvolvimento Web" },
  { slug: "Automação de Processos", label: "Automação" },
  { slug: "Consultoria em Tecnologia", label: "Consultoria em TI" },
  { slug: "Design & Identidade Visual", label: "Design & Identidade" },
  { slug: "Suporte Técnico", label: "Suporte Técnico" },
  { slug: "Marketing Digital", label: "Marketing Digital" },
] as const;

export const WHATSAPP_NUMBER = "5511939222885";

export const STORE_CONTACT = {
  phone: "+55 11 93922-2885",
  whatsapp: WHATSAPP_NUMBER,
  email: "decoanalytics@outlook.com.br",
  address: "",
  city: "",
  hours: [] as { day: string; time: string }[],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Decode+Analytics",
};

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function brl(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
