// Shared utility tokens for storefront components. Keep all visual values
// driven by CSS variables defined in src/styles.css so the admin theme
// stays untouched.

export const STORE_CATEGORIES = [
  { slug: "todos", label: "Todos os produtos", zh: "全部产品" },
  { slug: "Cartões", label: "Cartões de visita", zh: "名片" },
  { slug: "Panfletos", label: "Panfletos", zh: "宣传单" },
  { slug: "Adesivos", label: "Adesivos", zh: "贴纸" },
  { slug: "Canecas", label: "Canecas", zh: "定制马克杯" },
  { slug: "Camisetas", label: "Camisetas", zh: "定制T恤" },
  { slug: "Brindes", label: "Brindes", zh: "礼品" },
  { slug: "Banners", label: "Banners", zh: "横幅" },
  { slug: "Embalagens", label: "Embalagens", zh: "包装" },
  { slug: "Plotagem", label: "Plotagem", zh: "喷绘" },
] as const;

export const WHATSAPP_NUMBER = "5511972235342";

export const STORE_CONTACT = {
  phone: "+55 11 97223-5342",
  whatsapp: WHATSAPP_NUMBER,
  email: "contato@alcateiaproducoesgraficas.com.br",
  address: "Estrada do Cabreúva, 703 — Vila Santa Lúcia",
  city: "Carapicuíba — SP, CEP 06321-001",
  hours: [
    { day: "Segunda a Sexta", zhDay: "周一至周五", time: "09:00 – 18:00" },
    { day: "Sábado", zhDay: "周六", time: "09:00 – 13:00" },
    { day: "Domingo", zhDay: "周日", time: "Fechado / 休息" },
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

export function productNameZh(name: string, category?: string | null) {
  const value = `${name} ${category ?? ""}`.toLowerCase();
  if (value.includes("cartão")) return "定制名片";
  if (value.includes("panfleto") || value.includes("folheto")) return "定制宣传单";
  if (value.includes("adesivo") || value.includes("etiqueta")) return "定制贴纸";
  if (value.includes("caneca")) return "定制马克杯";
  if (value.includes("camiseta")) return "定制T恤";
  if (value.includes("brinde") || value.includes("caneta")) return "定制礼品";
  if (value.includes("banner") || value.includes("faixa")) return "定制横幅";
  if (value.includes("embalagem") || value.includes("caixa")) return "定制包装";
  if (value.includes("plotagem")) return "定制喷绘";
  return "定制印刷产品";
}
