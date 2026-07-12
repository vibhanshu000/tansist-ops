export function formatCurrency(n: number | undefined | null): string {
  if (n == null) return "₹0";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null) return "0";
  return n.toLocaleString();
}

export function formatDate(d: string | Date | undefined | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString();
}

export function isExpired(d: string | Date): boolean {
  return new Date(d).getTime() <= Date.now();
}
