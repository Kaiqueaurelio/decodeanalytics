import { Link, useRouterState } from "@tanstack/react-router";
import { EllaAvatar } from "@/components/EllaAvatar";

type EllaFabProps = {
  audience?: "public" | "staff";
};

export function EllaFab({ audience = "public" }: EllaFabProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const destination = audience === "staff" ? "/ella" : "/assistente";
  const label = "Ella Ribeiro · assistente virtual de inteligência artificial";

  if (pathname === destination) return null;

  return (
    <div
      className="group fixed z-40"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)",
        right: "calc(env(safe-area-inset-right) + 1.25rem)",
      }}
    >
      <Link
        to={destination}
        aria-label={`Conversar com ${label}`}
        title={`Conversar com ${label}`}
        className="relative block rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#22D3EE]/40"
      >
        <EllaAvatar
          size={58}
          alt=""
          loading="lazy"
          ringClassName="ring-2 ring-white shadow-xl"
          imgClassName="h-[58px] w-[58px]"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-[#087CF0] px-1.5 py-0.5 text-[9px] font-black leading-none text-white shadow"
        >
          IA
        </span>
      </Link>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[4.25rem] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0B1026] px-3 py-2 text-xs font-semibold text-white opacity-100 shadow-lg transition-opacity sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        Ella Ribeiro · IA
      </span>
    </div>
  );
}
