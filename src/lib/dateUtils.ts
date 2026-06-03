export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  return iso.replace(/-/g, '.');
}

export function toMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  return `${y}년 ${Number(m)}월`;
}
