// Shared tokens for the Decode Analytics service catalogue.
export const STORE_CATEGORIES = [
  { slug: "todos", label: "Todos os itens" },
  // Tecnologia aparece primeiro para priorizar os serviços digitais da Decode.
  { slug: "Desenvolvimento Digital", label: "Sites e aplicativos" },
  { slug: "Suporte Técnico", label: "Suporte técnico" },
  { slug: "Software e Licenças", label: "Software e licenças" },
  { slug: "Produtos Digitais", label: "Produtos digitais" },
  { slug: "Templates Digitais", label: "Templates" },
  { slug: "Design e Marketing", label: "Design e marketing" },
  { slug: "Produção Digital", label: "Produção digital" },
  { slug: "Imagem e Restauração", label: "Imagem e restauração" },
  { slug: "Serviços Acadêmicos", label: "Acadêmico" },
  { slug: "Impressão e Acabamentos", label: "Impressão e acabamentos" },
  { slug: "Impressão e Personalização", label: "Impressão e personalizados" },
  { slug: "Personalizados", label: "Canecas, copos e camisetas" },
  { slug: "Foto e Vídeo", label: "Foto e vídeo" },
] as const;

export const WHATSAPP_NUMBER = "5511939223885";

export const STORE_CONTACT = {
  phone: "+55 11 93922-3885",
  whatsapp: WHATSAPP_NUMBER,
  email: "decoanalytics@outlook.com.br",
  address: "",
  city: "",
  hours: [
    { day: "Domingo", time: "Fechada" },
    { day: "Segunda-feira", time: "08:00 - 22:00" },
    { day: "Terça-feira", time: "08:00 - 22:00" },
    { day: "Quarta-feira", time: "08:00 - 22:00" },
    { day: "Quinta-feira", time: "08:00 - 22:00" },
    { day: "Sexta-feira", time: "08:00 - 22:00" },
    { day: "Sábado", time: "09:00 - 16:00" },
  ],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Decode+Analytics",
};

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function brl(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
