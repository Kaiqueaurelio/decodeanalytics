import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { EllaAvatar } from "@/components/EllaAvatar";

type EllaFabProps = {
  audience?: "public" | "staff";
};
type Position = { left: number; top: number };
type DragState = { x: number; y: number; left: number; top: number; moved: boolean };

export function EllaFab({ audience = "public" }: EllaFabProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const destination = audience === "staff" ? "/ella" : "/assistente";
  const label = "Ella Ribeiro · assistente virtual de inteligência artificial";
  const [position, setPosition] = useState<Position | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const storageKey = `ella-bubble-position-${audience}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Position;
        if (Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
          setPosition({
            left: Math.max(8, Math.min(parsed.left, window.innerWidth - 76)),
            top: Math.max(8, Math.min(parsed.top, window.innerHeight - 76)),
          });
        }
      }
    } catch {
      // Local storage may be unavailable; use the default corner position.
    }
  }, [storageKey]);

  if (pathname === destination) return null;

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      drag.moved = true;
      didDragRef.current = true;
    }
    if (!drag.moved) return;
    const bubble = bubbleRef.current;
    const width = bubble?.offsetWidth ?? 70;
    const height = bubble?.offsetHeight ?? 70;
    setPosition({
      left: Math.max(8, Math.min(drag.left + dx, window.innerWidth - width - 8)),
      top: Math.max(8, Math.min(drag.top + dy, window.innerHeight - height - 8)),
    });
  }

  function finishDrag() {
    const drag = dragRef.current;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (drag?.moved && rect) {
      const next = { left: rect.left, top: rect.top };
      setPosition(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // The bubble remains movable for this session if storage is unavailable.
      }
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 150);
    }
    dragRef.current = null;
  }

  function suppressClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (dragRef.current?.moved) {
      event.preventDefault();
      dragRef.current = null;
    }
  }

  return (
    <div
      ref={bubbleRef}
      className="group fixed z-50 touch-none select-none"
      style={{
        ...(position
          ? { left: position.left, top: position.top }
          : {
              bottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
              ...(audience === "public"
                ? { left: "calc(env(safe-area-inset-left) + 1.25rem)" }
                : { right: "calc(env(safe-area-inset-right) + 1.25rem)" }),
            }),
        cursor: "grab",
      }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={() => { dragRef.current = null; }}
      title="Arraste para mover a Ella. Clique para abrir o chat."
    >
      <Link
        to={destination}
        onClick={suppressClick}
        aria-label={`Conversar com ${label}`}
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
        className={`pointer-events-none absolute ${audience === "public" ? "left-[4.25rem]" : "right-[4.25rem]"} top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0B1026] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {audience === "public" ? "Tire dúvidas com Ella · IA" : "Ella Ribeiro · IA"}
      </span>
    </div>
  );
}
