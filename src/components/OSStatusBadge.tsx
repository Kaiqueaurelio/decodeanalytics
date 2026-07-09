import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Badge
      className={cn(lc.className, className)}
      title={lc.description}
      aria-label={`Status: ${lc.label}`}
    >
      {lc.label}
    </Badge>
  );
}