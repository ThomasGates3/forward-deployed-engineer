export const pct = (x: number | null) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);
