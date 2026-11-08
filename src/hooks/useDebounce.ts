import { useEffect, useState } from "react";

/**
 * Hook para debounce de valores reativos (ex: inputs de busca, filtros rápidos).
 * Reduz a quantidade de chamadas à API e re-renders enquanto o usuário digita.
 *
 * @param value Valor a ser observado
 * @param delay Tempo em milissegundos (padrão: 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
