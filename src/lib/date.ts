export function getTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
