import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StoreProduct } from "./ProductCard";
import { resolveProductImage } from "./productImages";

const SELECT =
  "id,name,slug,category,short_description,base_price,image_url,rating,reviews_count,min_quantity,badge,specs,unit";

const FETCH_PAGE_SIZE = 500;

function normalizeProducts(rows: StoreProduct[]): StoreProduct[] {
  return rows.map((p) => ({
    ...p,
    image_url: resolveProductImage(p.image_url, p.category, p.slug),
  }));
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
