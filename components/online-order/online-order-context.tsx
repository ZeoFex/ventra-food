"use client";

import {
  readAddresses,
  readSession,
  writeAddresses,
  writeSession,
  type CustomerAddress,
  type OnlineSession,
} from "@/lib/online-account";
import {
  readOnlineOrderByRef,
  type OnlineOrder,
} from "@/lib/online-orders";
import { roundMoney } from "@/lib/pos-catalog";
import {
  customerOrderPath,
  getRestaurantBySlug,
  type Restaurant,
} from "@/lib/restaurants";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type OnlineCartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  imageSrc: string;
};

function cartStorageKey(restaurantSlug: string): string {
  return `ventra_online_cart_${restaurantSlug}`;
}

type OnlineOrderContextValue = {
  restaurant: Restaurant;
  restaurantSlug: string;
  /** Base path for this venue, e.g. /order/restrobit */
  basePath: string;
  cart: Record<string, OnlineCartLine>;
  cartCount: number;
  subtotalGhs: number;
  hydrated: boolean;
  session: OnlineSession | null;
  addresses: CustomerAddress[];
  addToCart: (line: Omit<OnlineCartLine, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setSession: (s: OnlineSession | null) => void;
  saveAddresses: (list: CustomerAddress[]) => void;
  addAddress: (input: Omit<CustomerAddress, "id">) => CustomerAddress;
  updateAddress: (id: string, patch: Partial<CustomerAddress>) => void;
  deleteAddress: (id: string) => void;
  getDefaultAddress: () => CustomerAddress | undefined;
  getOrder: (ref: string) => OnlineOrder | undefined;
};

const OnlineOrderContext = createContext<OnlineOrderContextValue | null>(null);

function loadCart(slug: string): Record<string, OnlineCartLine> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(cartStorageKey(slug));
    if (!raw) return {};
    const data = JSON.parse(raw) as Record<string, OnlineCartLine>;
    return typeof data === "object" && data ? data : {};
  } catch {
    return {};
  }
}

export function OnlineOrderProvider({
  restaurantSlug,
  children,
}: {
  restaurantSlug: string;
  children: React.ReactNode;
}) {
  const restaurant = getRestaurantBySlug(restaurantSlug);
  const slug = restaurant?.slug ?? restaurantSlug;
  const basePath = customerOrderPath(slug);

  const [cart, setCart] = useState<Record<string, OnlineCartLine>>({});
  const [session, setSessionState] = useState<OnlineSession | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(loadCart(slug));
    setSessionState(readSession());
    setAddresses(readAddresses());
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      localStorage.setItem(cartStorageKey(slug), JSON.stringify(cart));
    } catch {
      /* quota */
    }
  }, [cart, hydrated, slug]);

  const cartLines = useMemo(() => Object.values(cart), [cart]);

  const cartCount = useMemo(
    () => cartLines.reduce((s, l) => s + l.qty, 0),
    [cartLines],
  );

  const subtotalGhs = useMemo(
    () =>
      roundMoney(
        cartLines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
      ),
    [cartLines],
  );

  const addToCart = useCallback(
    (line: Omit<OnlineCartLine, "qty">, qty = 1) => {
      setCart((c) => {
        const prev = c[line.productId];
        const nextQty = (prev?.qty ?? 0) + qty;
        return {
          ...c,
          [line.productId]: { ...line, qty: nextQty },
        };
      });
    },
    [],
  );

  const setQty = useCallback((productId: string, qty: number) => {
    setCart((c) => {
      if (qty <= 0) {
        const next = { ...c };
        delete next[productId];
        return next;
      }
      const prev = c[productId];
      if (!prev) return c;
      return { ...c, [productId]: { ...prev, qty } };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[productId];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const setSession = useCallback((s: OnlineSession | null) => {
    setSessionState(s);
    writeSession(s);
  }, []);

  const saveAddresses = useCallback((list: CustomerAddress[]) => {
    setAddresses(list);
    writeAddresses(list);
  }, []);

  const addAddress = useCallback(
    (input: Omit<CustomerAddress, "id">) => {
      const row: CustomerAddress = {
        ...input,
        id: `addr-${Date.now().toString(36)}`,
      };
      setAddresses((prev) => {
        const list = input.isDefault
          ? prev.map((a) => ({ ...a, isDefault: false }))
          : [...prev];
        list.push(row);
        writeAddresses(list);
        return list;
      });
      return row;
    },
    [],
  );

  const updateAddress = useCallback((id: string, patch: Partial<CustomerAddress>) => {
    setAddresses((prev) => {
      let list = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      if (patch.isDefault) {
        list = list.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }));
      }
      writeAddresses(list);
      return list;
    });
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const list = prev.filter((a) => a.id !== id);
      writeAddresses(list);
      return list;
    });
  }, []);

  const getDefaultAddress = useCallback(
    () => addresses.find((a) => a.isDefault) ?? addresses[0],
    [addresses],
  );

  const getOrder = useCallback((ref: string) => {
    const o = readOnlineOrderByRef(ref);
    if (!o || o.restaurantSlug !== slug) return undefined;
    return o;
  }, [slug]);

  if (!restaurant) {
    return null;
  }

  const value = useMemo(
    (): OnlineOrderContextValue => ({
      restaurant,
      restaurantSlug: slug,
      basePath,
      cart,
      cartCount,
      subtotalGhs,
      hydrated,
      session,
      addresses,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      setSession,
      saveAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      getDefaultAddress,
      getOrder,
    }),
    [
      restaurant,
      slug,
      basePath,
      cart,
      cartCount,
      subtotalGhs,
      hydrated,
      session,
      addresses,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      setSession,
      saveAddresses,
      addAddress,
      updateAddress,
      deleteAddress,
      getDefaultAddress,
      getOrder,
    ],
  );

  return (
    <OnlineOrderContext.Provider value={value}>
      {children}
    </OnlineOrderContext.Provider>
  );
}

export function useOnlineOrder() {
  const ctx = useContext(OnlineOrderContext);
  if (!ctx) {
    throw new Error("useOnlineOrder must be used within OnlineOrderProvider");
  }
  return ctx;
}
