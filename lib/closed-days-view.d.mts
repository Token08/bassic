export function validDay(value: unknown): boolean;
export function shiftDay(value: string, days: number): string;
export function monthRange(month: string): { start: string; end: string };
export function overlaps(event: { start: string; end: string }, date: string): boolean;
