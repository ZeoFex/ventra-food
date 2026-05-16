"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import Link from "next/link";

export function MenuQrSetup() {
  const [origin, setOrigin] = useState("");
  const [tableHint, setTableHint] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const menuPath = "/menu";
  const targetUrl = useMemo(() => {
    if (!origin) return "";
    const u = new URL(menuPath, origin);
    if (tableHint.trim()) u.searchParams.set("table", tableHint.trim());
    return u.toString();
  }, [origin, tableHint]);

  const [copied, setCopied] = useState(false);
  const copyUrl = useCallback(() => {
    if (!targetUrl) return;
    void navigator.clipboard.writeText(targetUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [targetUrl]);

  return (
    <div className="border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#9ca3af]">
            RestroBit <span className="px-1">•</span> Guest ordering
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            QR menu setup
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--pos-muted)]">
            Print or display this code in your venue. Scanning opens the mobile
            menu where guests build a cart and place an order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#f9fafb]"
          >
            Preview menu
            <ExternalLink className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} />
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-[var(--pos-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--pos-primary-hover)]"
          >
            POS
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="flex flex-col items-center rounded-2xl border border-[var(--pos-border)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <QrCode className="h-5 w-5 text-[var(--pos-primary)]" strokeWidth={1.65} />
            Scan to order
          </div>
          {targetUrl ? (
            <div className="mt-4 rounded-xl bg-white p-3 ring-2 ring-[var(--pos-primary)]/20">
              <QRCodeSVG
                value={targetUrl}
                size={220}
                level="M"
                marginSize={2}
                className="h-auto w-full max-w-[220px]"
              />
            </div>
          ) : (
            <div className="mt-4 flex h-[220px] w-[220px] items-center justify-center rounded-xl bg-[#f4f4f5] text-sm text-[#9ca3af]">
              Loading…
            </div>
          )}
          <p className="mt-4 max-w-[260px] text-center text-[11px] leading-relaxed text-[#9ca3af]">
            Tip: laminate tent cards or show on a tablet at the table.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Optional table / zone label
            </label>
            <input
              value={tableHint}
              onChange={(e) => setTableHint(e.target.value)}
              placeholder="e.g. 6 or Patio-2"
              className="mt-1.5 w-full max-w-md rounded-lg border border-[var(--pos-border)] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[var(--pos-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--pos-primary)]/25"
            />
            <p className="mt-1 text-xs text-[#6b7280]">
              Adds <code className="rounded bg-[#f4f4f5] px-1">?table=…</code> so
              the guest screen shows which table ordered.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
              Link
            </p>
            <div className="mt-2 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-3 py-2 text-xs font-medium text-[#1a2233]">
                {targetUrl || "…"}
              </code>
              <button
                type="button"
                onClick={copyUrl}
                disabled={!targetUrl}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40"
              >
                <Copy className="h-4 w-4" strokeWidth={1.6} />
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">POS handoff</p>
            <p className="mt-1 text-xs text-amber-900/90">
              Guest orders are queued in{" "}
              <strong>session storage</strong> for this browser demo. Wire your
              API from the menu “Place order” action into{" "}
              <strong>QR menu orders</strong> on the POS header when you connect
              production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
