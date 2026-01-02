export type Timescale = 'day' | 'week' | 'month';

export interface TimescaleConfig {
  unitMs: number;
  pxPerUnit: number;
  label: (date: Date) => string;
}
