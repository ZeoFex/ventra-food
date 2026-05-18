"use client";

import { useSellableMenu } from "@/components/sellable-menu/sellable-menu-context";
import {
  QrMenuOrdersModal,
  type QrMenuOrder,
} from "@/components/pos/qr-menu-orders-modal";
import { AppSidebar } from "@/components/pos/app-sidebar";
import { OrderCartPanel } from "@/components/pos/order-cart-panel";
import { PosHeader } from "@/components/pos/pos-header";
import { ProductCatalog } from "@/components/pos/product-catalog";
import { playPosBeep, playQrOrderNotify } from "@/lib/pos-beep";
import {
  findPosProductByName,
  roundMoney,
  type PosCartLine,
  type PosProduct,
} from "@/lib/pos-catalog";
import {
  pushKitchenTicketForQrOrder,
} from "@/lib/kitchen-board-queue";
import {
  appendGuestOrderIfNew,
  guestPayloadToQrMenuOrder,
  GUEST_ORDERS_QUEUE_KEY,
  migrateSessionGuestQueueToLocal,
  notifyGuestOrderPlaced,
  QR_QUEUE_EVENT,
  QR_ORDERS_BROADCAST_CHANNEL,
  readGuestOrdersQueue,
  removeGuestOrderByRef,
  type GuestOrderPayload,
} from "@/lib/qr-guest-orders";
import { gooeyToast } from "goey-toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function qrLineId(name: string): string {
  return `qr:${name.trim().toLowerCase().replace(/\s+/g, "-")}`;
}

function qrOrderCartBadge(order: QrMenuOrder): string {
  const raw = order.tableOrName.trim();
  if (!raw || raw === "QR guest") {
    return "QR menu order · walk-up";
  }
  return `Table QR order · ${raw}`;
}

export function PosHome() {
  const { products } = useSellableMenu();
  const [draftOpen, setDraftOpen] = useState(false);
  const [qrOrdersOpen, setQrOrdersOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [orderNumber, setOrderNumber] = useState(15);
  const [cartLines, setCartLines] = useState<PosCartLine[]>([]);
  const [deferredQrRefs, setDeferredQrRefs] = useState<string[]>([]);
  const [qrQueueTick, setQrQueueTick] = useState(0);

  const cartLinesRef = useRef<PosCartLine[]>([]);
  const deferredQrRefsRef = useRef<string[]>([]);

  useEffect(() => {
    cartLinesRef.current = cartLines;
  }, [cartLines]);
  useEffect(() => {
    deferredQrRefsRef.current = deferredQrRefs;
  }, [deferredQrRefs]);

  const bumpQrQueueUi = useCallback(() => {
    setQrQueueTick((t) => t + 1);
  }, []);

  const qrOrdersPendingCount = useMemo(
    () => readGuestOrdersQueue().length,
    [qrQueueTick],
  );

  const mergeQrOrderIntoCart = useCallback((order: QrMenuOrder) => {
    const sumQty = order.items.reduce(
      (s, i) => s + Math.max(1, i.qty),
      0,
    );
    if (sumQty <= 0) return;
    playPosBeep("scan");
    const badge = qrOrderCartBadge(order);
    setCartLines((prev) => {
      const next = [...prev];
      for (const it of order.items) {
        const qty = Math.max(1, it.qty);
        const product = findPosProductByName(products, it.name);
        const lineTotal = order.total * (qty / sumQty);
        const unitPrice = product
          ? product.price
          : roundMoney(lineTotal / qty);
        const id = product?.id ?? qrLineId(it.name);
        const idx = next.findIndex((l) => l.id === id);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            qty: next[idx].qty + qty,
            qrOrderBadge: badge,
          };
        } else {
          next.push({
            id,
            name: product?.name ?? it.name,
            unitPrice,
            qty,
            qrOrderBadge: badge,
          });
        }
      }
      return next;
    });
    pushKitchenTicketForQrOrder(order);
  }, [products]);

  const ingestPendingFromQueue = useCallback(() => {
    let queueMutated = false;
    try {
      const queue = readGuestOrdersQueue();
      if (queue.length === 0) return;

      let cartOccupied = cartLinesRef.current.length > 0;
      const deferredSnap = deferredQrRefsRef.current;
      const toDefer: string[] = [];

      for (const payload of queue) {
        const ref = payload.ref;
        if (deferredSnap.includes(ref) || toDefer.includes(ref)) continue;

        playQrOrderNotify();

        if (!cartOccupied) {
          const order = guestPayloadToQrMenuOrder(payload);
          mergeQrOrderIntoCart(order);
          removeGuestOrderByRef(ref, { notify: false });
          queueMutated = true;
          cartOccupied = true;
          gooeyToast.success("QR order in cart", { description: ref });
        } else {
          toDefer.push(ref);
          gooeyToast.info("QR order queued", {
            description: `${ref} loads when the cart is clear.`,
          });
        }
      }

      if (toDefer.length > 0) {
        setDeferredQrRefs((prev) => {
          const next = [...prev];
          for (const r of toDefer) {
            if (!next.includes(r)) next.push(r);
          }
          return next;
        });
      }

      if (queueMutated) notifyGuestOrderPlaced();
    } finally {
      bumpQrQueueUi();
    }
  }, [bumpQrQueueUi, mergeQrOrderIntoCart]);

  useEffect(() => {
    migrateSessionGuestQueueToLocal();
  }, []);

  /** Phone / other-device orders: Redis relay → local queue (poll, ~450ms). */
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN?.trim();
    if (!token) return;

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/qr-orders/poll", {
          headers: { "x-qr-relay-token": token },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { orders?: GuestOrderPayload[] };
        const orders = Array.isArray(data.orders) ? data.orders : [];
        for (const p of orders) {
          appendGuestOrderIfNew(p);
        }
      } catch {
        /* offline */
      }
    };

    const id = window.setInterval(tick, 450);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    ingestPendingFromQueue();
  }, [ingestPendingFromQueue]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== GUEST_ORDERS_QUEUE_KEY) return;
      ingestPendingFromQueue();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [ingestPendingFromQueue]);

  useEffect(() => {
    const onQueue = () => ingestPendingFromQueue();
    window.addEventListener(QR_QUEUE_EVENT, onQueue);
    return () => window.removeEventListener(QR_QUEUE_EVENT, onQueue);
  }, [ingestPendingFromQueue]);

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(QR_ORDERS_BROADCAST_CHANNEL);
      ch.onmessage = () => ingestPendingFromQueue();
    } catch {
      /* ignore */
    }
    return () => {
      try {
        ch?.close();
      } catch {
        /* ignore */
      }
    };
  }, [ingestPendingFromQueue]);

  /** When the cart clears, load the next deferred QR order (FIFO). */
  useEffect(() => {
    if (cartLines.length > 0) return;
    if (deferredQrRefs.length === 0) return;

    const tid = window.setTimeout(() => {
      const deferred = deferredQrRefsRef.current;
      if (deferred.length === 0) return;
      const nextRef = deferred[0];
      const queue = readGuestOrdersQueue();
      const payload = queue.find((q) => q.ref === nextRef);

      setDeferredQrRefs((d) =>
        d.length > 0 && d[0] === nextRef ? d.slice(1) : d,
      );

      if (!payload) {
        bumpQrQueueUi();
        return;
      }

      removeGuestOrderByRef(nextRef, { notify: false });
      const order = guestPayloadToQrMenuOrder(payload);
      mergeQrOrderIntoCart(order);
      playQrOrderNotify();
      gooeyToast.success("QR order loaded", { description: nextRef });
      notifyGuestOrderPlaced();
      bumpQrQueueUi();
    }, 0);

    return () => window.clearTimeout(tid);
  }, [
    cartLines.length,
    deferredQrRefs.length,
    mergeQrOrderIntoCart,
    bumpQrQueueUi,
  ]);

  const qtyByProductId = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of cartLines) {
      if (l.id.startsWith("pos-")) m[l.id] = l.qty;
    }
    return m;
  }, [cartLines]);

  const addToCart = useCallback((product: PosProduct) => {
    playPosBeep("scan");
    setCartLines((prev) => {
      const i = prev.findIndex((l) => l.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          unitPrice: product.price,
          qty: 1,
        },
      ];
    });
  }, []);

  const onIncrementLine = useCallback((lineId: string) => {
    playPosBeep("tick");
    setCartLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, qty: l.qty + 1 } : l,
      ),
    );
  }, []);

  const onDecrementLine = useCallback((lineId: string) => {
    playPosBeep("tick");
    setCartLines((prev) =>
      prev.flatMap((l) => {
        if (l.id !== lineId) return [l];
        if (l.qty <= 1) return [];
        return [{ ...l, qty: l.qty - 1 }];
      }),
    );
  }, []);

  const onRemoveLine = useCallback((lineId: string) => {
    playPosBeep("remove");
    setCartLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  const startNewOrder = useCallback(() => {
    if (
      cartLines.length > 0 &&
      !window.confirm(
        "Start a new order? The current cart will be cleared.",
      )
    ) {
      return;
    }
    setCartLines([]);
    setOrderNumber((n) => n + 1);
    playPosBeep("newOrder");
  }, [cartLines.length]);

  const onPaymentSettled = useCallback(() => {
    setCartLines([]);
    setOrderNumber((n) => n + 1);
    playPosBeep("newOrder");
  }, []);

  const handleAcceptQrToPos = useCallback(
    (order: QrMenuOrder) => {
      removeGuestOrderByRef(order.code);
      setDeferredQrRefs((d) => d.filter((r) => r !== order.code));
      mergeQrOrderIntoCart(order);
      bumpQrQueueUi();
    },
    [mergeQrOrderIntoCart, bumpQrQueueUi],
  );

  const handleDismissQrOrder = useCallback(
    (code: string) => {
      setDeferredQrRefs((d) => d.filter((r) => r !== code));
      bumpQrQueueUi();
    },
    [bumpQrQueueUi],
  );

  const onSetLineNotes = useCallback((lineId: string, notes: string) => {
    const trimmed = notes.trim();
    setCartLines((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, notes: trimmed || undefined } : l,
      ),
    );
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PosHeader
          searchQuery={catalogSearch}
          onSearchChange={setCatalogSearch}
          onNewOrder={startNewOrder}
          onOpenDraftList={() => setDraftOpen(true)}
          onOpenQrMenuOrders={() => setQrOrdersOpen(true)}
          qrOrdersPendingCount={qrOrdersPendingCount}
        />
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch py-3 pr-3">
          <ProductCatalog
            onAddToCart={addToCart}
            qtyByProductId={qtyByProductId}
            searchQuery={catalogSearch}
            onSearchChange={setCatalogSearch}
          />
          <OrderCartPanel
            draftOpen={draftOpen}
            onDraftOpenChange={setDraftOpen}
            orderNumber={orderNumber}
            lines={cartLines}
            onIncrementLine={onIncrementLine}
            onDecrementLine={onDecrementLine}
            onRemoveLine={onRemoveLine}
            onSetLineNotes={onSetLineNotes}
            onPaymentSettled={onPaymentSettled}
          />
        </div>
      </div>

      <QrMenuOrdersModal
        open={qrOrdersOpen}
        onClose={() => setQrOrdersOpen(false)}
        onAcceptToPos={handleAcceptQrToPos}
        onDismissQrOrder={handleDismissQrOrder}
      />
    </div>
  );
}
