export type OperationHealth = {
  id: string; label: string; state: "ok" | "pending" | "disabled" | "error" | "unknown";
  message: string; checkedAt: string; actionsUrl?: string; lastRunAt?: string;
};
export type OperationsHealth = { checkedAt: string; services: OperationHealth[]; ok: boolean };
export function operationsHealth(options?: { fetcher?: typeof fetch; token?: string; owner?: string; repo?: string; calendarExpected?: boolean; now?: number }): Promise<OperationsHealth>;
