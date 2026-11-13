export function decodeEventFromStorage<T extends object>(item: T): T;
export function packEventRecord(item: Record<string, unknown>, options?: { legacyId?: string; removed?: boolean }): Record<string, unknown>;
export function mergeEventRecords<T extends object>(legacy: T[], compact: object[]): T[];
