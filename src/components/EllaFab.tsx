import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { EllaAvatar } from "@/components/EllaAvatar";

type EllaFabProps = {
  audience?: "public" | "staff";
};
type Position = { left: number; top: number };
type DragState = { pointerId: number; x: number; y: number; left: number; top: number; moved: boolean };

const EDGE_GAP = 8;
const BUBBLE_SIZE = 64;

export function EllaFab({ audience = "public" }: EllaFabProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const destination = audience === "staff" ? "/ella" : "/assistente";
  const label = "Ella Ribeiro, assistente virtual";
  const [position, setPosition] = useState<Position | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const resetDragClickTimer = useRef<number | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const storageKey = `ella-bubble-position-${audience}`;

  const clampPosition = useCallback((left: number, top: number, width = BUBBLE_SIZE, height = BUBBLE_SIZE): Position => ({
    left: Math.max(EDGE_GAP, Math.min(left, window.innerWidth - width - EDGE_GAP)),
    top: Math.max(EDGE_GAP, Math.min(top, window.innerHeight - height - EDGE_GAP)),
  }), []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Position;
        if (Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
          setPosition(clampPosition(parsed.left, parsed.top));
        }
      }
    } catch {
      // Local storage may be unavailable; use the default corner position.
    }

    const keepInViewport = () => {
      const rect = bubbleRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition((current) => current ? clampPosition(rect.left, rect.top, rect.width, rect.height) : current);
    };
    window.addEventListener("resize", keepInViewport);
    return () => {
      window.removeEventListener("resize", keepInViewport);
      if (resetDragClickTimer.current !== null) window.clearTimeout(resetDragClickTimer.current);
    };
  }, [storageKey, clampPosition]);

  if (pathname === destination) return null;

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (resetDragClickTimer.current !== null) window.clearTimeout(resetDragClickTimer.current);
    didDragRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is not supported in every embedded browser.
    }
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;

    drag.moved = true;
    didDragRef.current = true;
    event.preventDefault();
    const rect = bubbleRef.current?.getBoundingClientRect();
    setPosition(clampPosition(drag.left + dx, drag.top + dy, rect?.width, rect?.height));
  }

  function finishDrag(event?: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (event && drag && event.pointerId !== drag.pointerId) return;

    if (drag?.moved) {
      const rect = bubbleRef.current?.getBoundingClientRect();
      if (rect) {
        const next = clampPosition(rect.left, rect.top, rect.width, rect.height);
        setPosition(next);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // The bubble remains movable for this session if storage is unavailable.
        }
      }
      // Prevent the synthetic click after pointer-up from opening the chat.
      resetDragClickTimer.current = window.setTimeout(() => {
        didDragRef.current = false;
        resetDragClickTimer.current = null;
      }, 350);
    }
    dragRef.current = null;
  }

  function suppressClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (didDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
      didDragRef.current = false;
      if (resetDragClickTimer.current !== null) {
        window.clearTimeout(resetDragClickTimer.current);
        resetDragClickTimer.current = null;
      }
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
        cursor: dragRef.current ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      title="Arraste para mover a Ella. Clique para abrir a conversa."
    >
      <Link
        to={destination}
        onClick={suppressClick}
        aria-label={`Conversar com ${label}`}
        className="relative block rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#22D3EE]/40"
        draggable={false}
      >
        <EllaAvatar
          size={58}
          alt={label}
          loading="lazy"
          ringClassName="ring-2 ring-white shadow-xl"
          imgClassName="h-[58px] w-[58px]"
        />
      </Link>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute ${audience === "public" ? "left-[4.25rem]" : "right-[4.25rem]"} top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#0B1026] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {audience === "public" ? "Tire dúvidas com Ella" : "Ella Ribeiro"}
      </span>
    </div>
  );
}
