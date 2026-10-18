// Shared tokens for the Decode Analytics service catalogue.
export const STORE_CATEGORIES = [
  { slug: "todos", label: "Todos os itens" },
  { slug: "Impressão e Acabamentos", label: "Impressão e acabamentos" },
  { slug: "Impressão e Personalização", label: "Impressão e personalizados" },
  { slug: "Personalizados", label: "Canecas, copos e camisetas" },
  { slug: "Foto e Vídeo", label: "Foto e vídeo" },
  { slug: "Produção Digital", label: "Produção digital" },
  { slug: "Imagem e Restauração", label: "Imagem e restauração" },
  { slug: "Serviços Acadêmicos", label: "Acadêmico" },
  { slug: "Desenvolvimento Digital", label: "Sites e aplicativos" },
  { slug: "Design e Marketing", label: "Design e marketing" },
  { slug: "Suporte Técnico", label: "Suporte técnico" },
  { slug: "Software e Licenças", label: "Software e licenças" },
  { slug: "Produtos Digitais", label: "Produtos digitais" },
  { slug: "Templates Digitais", label: "Templates" },
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
