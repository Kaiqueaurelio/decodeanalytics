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
      className: "bg-green-500 text-white border-green-500 hover:bg-green-500",
      description: "OS concluída e entregue ao cliente",
    };
  if (status === "cancelado" || status === "pausado")
    return {
      label: "ARQUIVADA",
      className: "bg-gray-500 text-white border-gray-500 hover:bg-gray-500",
      description:
        status === "cancelado"
          ? "OS cancelada"
          : "OS pausada / arquivada temporariamente",
    };
  return {
    label: "EM PRODUÇÃO",
    className: "bg-blue-500 text-white border-blue-500 hover:bg-blue-500",
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