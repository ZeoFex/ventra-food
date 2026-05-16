/** Ghana cedi (GHS) — GH₵ prefix, en-GH grouping */

const PREFIX = "GH₵";

export function formatCedi(amount: number): string {
  return `${PREFIX}${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Quick keys / whole amounts (e.g. GH₵50) */
export function formatCediWhole(amount: number): string {
  return `${PREFIX}${amount.toLocaleString("en-GH", {
    maximumFractionDigits: 0,
  })}`;
}
