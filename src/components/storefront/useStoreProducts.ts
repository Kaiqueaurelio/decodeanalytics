import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { StoreProduct } from "./ProductCard";
import { resolveProductImage } from "./productImages";

const SELECT =
  "id,name,slug,category,short_description,base_price,image_url,rating,reviews_count,min_quantity,badge,specs,unit";

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
      try {
        let q = supabase
          .from("services")
          .select(SELECT)
          .eq("active", true)
          .order("reviews_count", { ascending: false });
        if (limit) q = q.limit(limit);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return normalizeProducts((data ?? []) as StoreProduct[]);
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error("Falha ao carregar os produtos.");
      }
    },
    staleTime: 15_000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // Erro nunca fica silencioso: avisa uma vez por falha.
  const notified = useRef(false);
  useEffect(() => {
    if (query.isError && !notified.current) {
      notified.current = true;
      toast.error("Não foi possível carregar os produtos", {
        description:
          (query.error as Error)?.message ??
          "Verifique sua conexão e tente novamente.",
      });
    }
    if (!query.isError) notified.current = false;
  }, [query.isError, query.error]);

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
