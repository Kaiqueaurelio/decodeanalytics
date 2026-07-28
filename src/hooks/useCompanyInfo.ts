import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STORE_CONTACT, WHATSAPP_NUMBER } from "@/components/storefront/tokens";

export interface CompanyInfo {
  name: string;
  logoUrl: string | null;
  whatsappDigits: string; // ex: 5511972235342
  whatsappDisplay: string; // ex: +55 11 97223-5342
  instagram: string | null; // ex: @alcateiasproducoesgraficas
  instagramUrl: string | null;
  address: string;
  email: string;
  mapsUrl: string;
  hours: { day: string; time: string }[];
  showPrices: boolean;
}

function digitsOnly(v?: string | null) {
  return (v ?? "").replace(/\D+/g, "");
}

function formatBrPhone(digits: string) {
  const d = digits.startsWith("55") ? digits : `55${digits}`;
  if (d.length < 12) return `+${d}`;
  const country = d.slice(0, 2);
  const area = d.slice(2, 4);
  const rest = d.slice(4);
  const first = rest.slice(0, rest.length - 4);
  const last = rest.slice(-4);
  return `+${country} ${area} ${first}-${last}`;
}

function normalizeInstagram(v?: string | null) {
  if (!v) return { handle: null as string | null, url: null as string | null };
  const handle = v.trim().startsWith("@") ? v.trim() : `@${v.trim()}`;
  const user = handle.replace(/^@/, "");
  return { handle, url: `https://instagram.com/${user}` };
}

export function useCompanyInfo(): CompanyInfo {
  const { data } = useQuery({
    queryKey: ["company_settings", "public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("name,logo_url,whatsapp,instagram,address,show_prices")
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const waDigits = digitsOnly(data?.whatsapp) || WHATSAPP_NUMBER;
  const insta = normalizeInstagram(data?.instagram);

  return {
    name: data?.name ?? "Alcateia's Produções Gráficas",
    logoUrl: data?.logo_url ?? null,
    whatsappDigits: waDigits,
    whatsappDisplay: data?.whatsapp?.trim() || formatBrPhone(waDigits),
    instagram: insta.handle,
    instagramUrl: insta.url,
    address: data?.address ?? `${STORE_CONTACT.address}, ${STORE_CONTACT.city}`,
    email: STORE_CONTACT.email,
    mapsUrl: data?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
      : STORE_CONTACT.mapsUrl,
    hours: STORE_CONTACT.hours,
    showPrices: data?.show_prices !== false,
  };
}

/** Preços visíveis na loja pública (configurável pelo admin em Configurações). */
export function useShowPrices() {
  return useCompanyInfo().showPrices;
}

export function useWaLink() {
  const info = useCompanyInfo();
  return (message: string) =>
    `https://wa.me/${info.whatsappDigits}?text=${encodeURIComponent(message)}`;
}