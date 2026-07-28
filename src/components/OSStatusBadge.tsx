import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type OSLifecycle = {
  label: string;
  className: string;
  description: string;
};

export function lifecycleFor(status?: string | null): OSLifecycle {
  if (status === "entregue")
    return {
      label: "CONCLUÍDA",
      className: "bg-success text-inverse border-success/30 hover:bg-success",
      description: "OS concluída e entregue ao cliente",
    };
  if (status === "cancelado" || status === "pausado")
    return {
      label: "ARQUIVADA",
      className: "bg-surface-dark text-inverse border-surface-dark-soft hover:bg-surface-dark",
      description:
        status === "cancelado"
          ? "OS cancelada"
          : "OS pausada / arquivada temporariamente",
    };
  return {
    label: "EM PRODUÇÃO",
    className: "bg-info text-inverse border-info/30 hover:bg-info",
    description: "OS em andamento na produção",
  };
}

interface Props {
  status?: string | null;
  className?: string;
}

export function OSStatusBadge({ status, className }: Props) {
  const lc = lifecycleFor(status);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn("cursor-help", lc.className, className)}
            aria-label={`Status: ${lc.label}. ${lc.description}`}
          >
            {lc.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-semibold">{lc.label}</p>
          <p className="text-muted-foreground">{lc.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}