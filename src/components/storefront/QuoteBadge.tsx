import { memo } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const QUOTE_HINT =
  "Os preços deste catálogo estão ocultos. Fale com a equipe pelo WhatsApp para receber um orçamento personalizado.";

/** Badge "Sob consulta" com tooltip explicando a ocultação de preços. */
export const QuoteBadge = memo(function QuoteBadge({ className }: { className?: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            title={QUOTE_HINT}
            tabIndex={0}
            className={cn(
              "inline-flex cursor-help items-center gap-1 rounded-full border border-[var(--store-border)] bg-[var(--store-surface-soft)] px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-[var(--store-text-muted)] outline-none transition-colors hover:border-[var(--store-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--store-primary-light)]/40",
              className,
            )}
          >
            Sob consulta
            <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-center leading-snug">
          {QUOTE_HINT}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});