import { Timescale } from './timescale-model';

export interface TimescaleConfig {
  unitMs: number;
  pxPerUnit: number;
  label: (d: Date) => string;
}

const DAY = 24 * 60 * 60 * 1000;

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY + 1) / 7);
}

export const TIMESCALE_CONFIG: Record<Timescale, TimescaleConfig> = {
  day: {
    unitMs: DAY,
    pxPerUnit: 48,
    label: (d) => d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
  },

  week: {
    unitMs: DAY * 7,
    pxPerUnit: 80,
    label: (d) => `W${getWeekNumber(d)}`,
  },
  // week: {
  //   pxPerUnit: 120,
  //   label: (d: Date) => `W${getWeekNumber(d)}`,
  // },

  month: {
    unitMs: DAY * 30, // visual scale only (not calendar-accurate)
    pxPerUnit: 140,
    label: (d) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  },
};
