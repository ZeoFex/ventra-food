"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import Link from "next/link";

const MAX_TABLES = 99;
const QR_SIZE = 132;

export function MenuQrSetup() {
  const [origin, setOrigin] = useState("");
  const [tableCount, setTableCount] = useState(8);
  const [copiedTable, setCopiedTable] = useState<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const tableQrList = useMemo(() => {
    if (!origin || tableCount < 1) return [];
    const n = Math.min(MAX_TABLES, Math.max(1, Math.floor(tableCount)));
    const qrTok =
      typeof process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN === "string"
        ? process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN.trim()
        : "";
    return Array.from({ length: n }, (_, i) => {
      const num = i + 1;
      const u = new URL("/menu", origin);
      u.searchParams.set("table", String(num));
      if (qrTok) u.searchParams.set("qr_t", qrTok);
      return { tableNum: num, url: u.toString() };
    });
  }, [origin, tableCount]);

  const copyTableUrl = useCallback((tableNum: number, url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedTable(tableNum);
      window.setTimeout(() => setCopiedTable(null), 2000);
    });
  }, []);

  return (
    <div className="border-b border-[var(--pos-border)] bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#9ca3af]">
            Ventra Food <span className="px-1">•</span> Guest ordering
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            QR menu per table
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--pos-muted)]">
            Set how many tables you have. Each table gets its own QR code linking to{" "}
            <code className="rounded bg-[#f4f4f5] px-1 text-xs">/menu?table=N</code>.
            When guests order, staff see which table it came from.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={
              process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN?.trim()
                ? `/menu?table=1&qr_t=${encodeURIComponent(process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN.trim())}`
                : "/menu?table=1"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2 text-sm font-medium text-[#374151] shadow-sm hover:bg-[#f9fafb]"
          >
            Preview (Table 1)
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

      <div className="mt-8 flex flex-col gap-8">
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--pos-border)] bg-[#fafafa] p-4 sm:p-5">
          <div>
            <label
              htmlFor="table-count"
              className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]"
            >
              Number of tables
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="table-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_TABLES}
                value={tableCount}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) {
                    setTableCount(1);
                    return;
                  }
                  setTableCount(Math.min(MAX_TABLES, Math.max(1, v)));
                }}
                className="w-24 rounded-lg border border-[var(--pos-border)] bg-white px-3 py-2.5 text-sm font-semibold tabular-nums outline-none focus:border-[var(--pos-primary)] focus:ring-2 focus:ring-[var(--pos-primary)]/25"
              />
              <span className="text-sm text-[#6b7280]">
                → {tableQrList.length} QR{tableQrList.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#6b7280]">
              Tables are numbered <strong>1</strong> through{" "}
              <strong>{tableQrList.length || "—"}</strong> (max {MAX_TABLES}). Print one code per table stand.
            </p>
          </div>
        </div>

        {!origin ? (
          <p className="text-sm text-[#9ca3af]">Loading…</p>
        ) : tableQrList.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Enter at least one table to generate QR codes.</p>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <QrCode className="h-5 w-5 text-[var(--pos-primary)]" strokeWidth={1.65} />
              Table codes
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {tableQrList.map(({ tableNum, url }) => (
                <div
                  key={tableNum}
                  className="flex flex-col items-center rounded-2xl border border-[var(--pos-border)] bg-white p-4 shadow-sm"
                >
                  <p className="text-center text-sm font-bold text-[var(--foreground)]">
                    Table {tableNum}
                  </p>
                  <p className="mt-0.5 text-center text-[10px] text-[#9ca3af]">
                    ?table={tableNum}
                  </p>
                  <div className="mt-3 rounded-xl bg-white p-2 ring-1 ring-[var(--pos-primary)]/15">
                    <QRCodeSVG
                      value={url}
                      size={QR_SIZE}
                      level="M"
                      marginSize={2}
                      className="h-auto w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTableUrl(tableNum, url)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--pos-border)] bg-[#fafafa] px-2 py-2 text-xs font-semibold text-[#374151] hover:bg-[#f4f4f5]"
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {copiedTable === tableNum ? "Copied" : "Copy link"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">
            {process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN?.trim()
              ? "POS sync · Redis relay"
              : "POS handoff (same browser only)"}
          </p>
          <p className="mt-1 text-xs text-amber-900/90">
            {process.env.NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN?.trim() ? (
              <>
                Guest links include <code className="rounded bg-amber-100/90 px-1 font-mono text-[10px]">qr_t</code>.
                Orders POST to your deployment and staff POS polls Redis (same{" "}
                <code className="rounded bg-amber-100/90 px-1 font-mono text-[10px]">
                  KV_REST_*
                </code>{" "}
                env as Vercel KV / Upstash). Also still writes{" "}
                <strong>localStorage</strong> on the guest device for instant confirmation UI.
              </>
            ) : (
              <>
                Without{" "}
                <code className="rounded bg-amber-100/90 px-1 font-mono text-[10px]">
                  NEXT_PUBLIC_QR_ORDER_RELAY_TOKEN
                </code>{" "}
                + Redis env vars, orders stay in{" "}
                <strong>localStorage</strong> only — fine for two tabs on one PC, not for phones.
                Redownload QR codes after enabling relay so URLs pick up{" "}
                <code className="rounded bg-amber-100/90 px-1 font-mono text-[10px]">qr_t</code>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
