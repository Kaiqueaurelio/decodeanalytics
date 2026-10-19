import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  category: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
  observation?: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "alcateia_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CartItem => {
      if (!item || typeof item !== "object") return false;
      const cartItem = item as Partial<CartItem>;
      return typeof cartItem.id === "string" &&
        typeof cartItem.name === "string" &&
        typeof cartItem.price === "number" && Number.isFinite(cartItem.price) &&
        typeof cartItem.quantity === "number" && Number.isFinite(cartItem.quantity) &&
        cartItem.quantity > 0;
    });
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Keep the cart usable in memory if browser storage is unavailable.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = Math.max(1, newItem.quantity ?? 1);
      setItems((current) => {
        const existing = current.find((i) => i.id === newItem.id);
        if (existing) {
          return current.map((i) =>
            i.id === newItem.id ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [...current, { ...newItem, quantity: qty }];
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.id !== id)
        : current.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
