export const CMS_READ_TIMEOUT_MS = 8000;
export const CMS_WRITE_TIMEOUT_MS = 30000;

export class ContentStorageError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message || (status === 400 ? "保存先が入力形式を受け付けませんでした（CMS 400）。" :
      status === 401 || status === 403 ? "保存先への書き込み権限を確認する必要があります。" : "保存先に接続できませんでした。時間をおいて再度お試しください。"));
    this.name = "ContentStorageError";
    this.status = status;
  }
}

// Log only our endpoint/method, duration and error category. Never log headers,
// request contents, upstream error messages or credential-bearing URLs.
export async function cmsRequest(url: string, init: RequestInit, endpoint: string) {
  const method = (init.method || "GET").toUpperCase();
  const writing = method !== "GET";
  const timeout = AbortSignal.timeout(writing ? CMS_WRITE_TIMEOUT_MS : CMS_READ_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      ...init,
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
      cache: "no-store"
    });
    if (!response.ok) throw new ContentStorageError(response.status);
    if (response.status === 204) return null;
    return (response.headers.get("content-type") || "").includes("application/json")
      ? await response.json() : { message: await response.text() };
  } catch (error) {
    const kind = timeout.aborted ? "timeout" : error instanceof ContentStorageError ? "http" :
      init.signal?.aborted ? "cancelled" : "transport-or-response";
    console.error("CMS request failed", {
      endpoint: endpoint.split("?")[0], method, elapsedMs: Date.now() - started,
      kind, ...(error instanceof ContentStorageError ? { status: error.status } : {})
    });
    if (error instanceof ContentStorageError) throw error;
    throw new ContentStorageError(502, writing
      ? endpoint.split("?")[0] === "/events"
        ? "保存先から登録結果を確認できませんでした。Googleカレンダーへの登録も未確認です。少し待って、Facebookから再度読み取って登録状況を確認してください。"
        : "保存先から結果を確認できませんでした。すぐに保存を繰り返さず、少し待って保存状況を確認してください。"
      : "保存先を読み込めませんでした。少し待ってからもう一度お試しください。");
  }
}
