/** Quiz day in UTC (YYYY-MM-DD). The daily-quiz seed changes at UTC midnight. */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
