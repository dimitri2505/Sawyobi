const numberFormatter = new Intl.NumberFormat("ka-GE", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const numberFormatter4 = new Intl.NumberFormat("ka-GE", {
  maximumFractionDigits: 4,
  minimumFractionDigits: 0,
});

const moneyFormatter = new Intl.NumberFormat("ka-GE", {
  style: "currency",
  currency: "GEL",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("ka-GE", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ka-GE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatNumber(
  value: number | string | null | undefined,
  precise = false,
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return precise ? numberFormatter4.format(n) : numberFormatter.format(n);
}

export function formatMoney(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return moneyFormatter.format(n);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

export function formatDateTime(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFormatter.format(d);
}

export function toNumber(
  value: number | string | null | undefined,
  fallback = 0,
): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}
