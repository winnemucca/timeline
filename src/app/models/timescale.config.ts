import { Timescale, TimescaleConfig } from "./timescale-model";

export const TIMESCALE_CONFIG: Record<Timescale, TimescaleConfig> = {
  day: {
    unitMs: 24 * 60 * 60 * 1000,
    pxPerUnit: 48,
    label: (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  },

  week: {
    unitMs: 7 * 24 * 60 * 60 * 1000,
    pxPerUnit: 80,
    label: (d) => `Week ${getWeekNumber(d)}`,
  },

  month: {
    unitMs: 30 * 24 * 60 * 60 * 1000,
    pxPerUnit: 120,
    label: (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  },
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
