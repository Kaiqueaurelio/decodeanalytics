// Shared utility tokens for storefront components. Keep all visual values
// driven by CSS variables defined in src/styles.css so the admin theme
// stays untouched.

export const STORE_CATEGORIES = [
  { slug: "todos", label: "Todos os produtos" },
  { slug: "Cartões", label: "Cartões de visita" },
  { slug: "Panfletos", label: "Panfletos" },
  { slug: "Adesivos", label: "Adesivos" },
  { slug: "Canecas", label: "Canecas" },
  { slug: "Camisetas", label: "Camisetas" },
  { slug: "Brindes", label: "Brindes" },
  { slug: "Banners", label: "Banners" },
  { slug: "Embalagens", label: "Embalagens" },
  { slug: "Plotagem", label: "Plotagem" },
  { slug: "Encadernação", label: "Encadernação" },
  { slug: "Laminação e Plastificação", label: "Laminação" },
  { slug: "Cartazes", label: "Cartazes" },
  { slug: "Convites", label: "Convites" },
  { slug: "Copos Térmicos", label: "Copos térmicos" },
  { slug: "Manutenção de Computadores", label: "Manutenção de PC" },
  { slug: "Social Media", label: "Social Media" },
  { slug: "Design Gráfico", label: "Design Gráfico" },
  { slug: "Programação", label: "Programação" },
] as const;

export const WHATSAPP_NUMBER = "5511939222885";

export const STORE_CONTACT = {
  phone: "+55 11 93922-2885",
  whatsapp: WHATSAPP_NUMBER,
  email: "decoanalytics@outlook.com.br",
  address: "Estrada do Cabreúva, 703 — Vila Santa Lúcia",
  city: "Carapicuíba — SP, CEP 06321-001",
  hours: [
    { day: "Domingo", time: "Fechado" },
    { day: "Segunda-feira", time: "08:00 – 22:00" },
    { day: "Terça-feira", time: "08:00 – 22:00" },
    { day: "Quarta-feira", time: "08:00 – 22:00" },
    { day: "Quinta-feira", time: "08:00 – 22:00" },
    { day: "Sexta-feira", time: "08:00 – 22:00" },
    { day: "Sábado", time: "09:00 – 16:00" },
  ],
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Estrada+do+Cabre%C3%BAva+703+Vila+Santa+L%C3%BAcia+Carapicu%C3%ADba+SP",
};

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function brl(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
