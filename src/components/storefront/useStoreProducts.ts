import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StoreProduct } from "./ProductCard";

const SELECT =
  "id,name,slug,category,short_description,base_price,image_url,rating,reviews_count,min_quantity,badge,specs,unit";

const FETCH_PAGE_SIZE = 500;

// Itens que a empresa confirmou que não oferece. Filtrados da vitrine sem
// apagar registros do banco, para evitar perda de dados ou alterações no admin.
export function isOfferedProduct(p: StoreProduct): boolean {
  const text = `${p.slug ?? ""} ${p.name ?? ""} ${p.category ?? ""} ${p.short_description ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ");

  if (/camiseta\s*silk|silk\s*(screen|screening)?|polo\s*bordad|hot\s*stamping|holografic|banner\s*backlight/.test(text)) {
    return false;
  }

  // Chaveiros só são oferecidos quando forem impressos em 3D.
  if (/chaveiro|keychain/.test(text) && !/3d|impressao\s*3d/.test(text)) {
    return false;
  }

  return true;
}

export function isComputerService(p: StoreProduct): boolean {
  const text = `${p.slug ?? ""} ${p.name ?? ""} ${p.category ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  return /manutencao de computadores|informatica|suporte tecnico|formatacao|diagnostico de hardware|upgrade ssd|limpeza.*pasta termica/.test(text);
}

function normalizeProducts(rows: StoreProduct[]): StoreProduct[] {
  return rows
    .filter(isOfferedProduct)
    .map((p) => ({
      ...p,
      // Use somente a foto real cadastrada pelo administrador. Sem foto, SmartImage\n      // mostra um placeholder em vez de uma imagem ilustrativa/genérica.\n      image_url: p.image_url,
    }))
    .sort((a, b) => Number(isComputerService(b)) - Number(isComputerService(a)));
}

export function useStoreProducts(limit?: number) {
  const qc = useQueryClient();
  const key = ["store-products", limit ?? "all"] as const;

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (limit) {
        const { data, error } = await supabase
          .from("services")
          .select(SELECT)
          .eq("active", true)
          .order("reviews_count", { ascending: false })
          .limit(limit);
        if (error) throw error;
        return normalizeProducts((data ?? []) as StoreProduct[]);
      }

      // Supabase limits the number of rows returned by one request. Page through
      // the active catalog so the landing page can truly show every product.
      const rows: StoreProduct[] = [];
      for (let from = 0; ; from += FETCH_PAGE_SIZE) {
        const { data, error } = await supabase
          .from("services")
          .select(SELECT)
          .eq("active", true)
          .order("reviews_count", { ascending: false })
          .order("id", { ascending: true })
          .range(from, from + FETCH_PAGE_SIZE - 1);
        if (error) throw error;

        const page = (data ?? []) as StoreProduct[];
        rows.push(...page);
        if (page.length < FETCH_PAGE_SIZE) break;
      }
      return normalizeProducts(rows);
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  // Realtime: qualquer alteração no painel admin atualiza a landing na hora.
  useEffect(() => {
    const channel = supabase
      .channel(`services-stream-${limit ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => {
          qc.invalidateQueries({ queryKey: ["store-products"] });
          qc.invalidateQueries({ queryKey: ["store-catalog"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, limit]);

  return query;
}
