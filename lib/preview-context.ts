import { AsyncLocalStorage } from "node:async_hooks";
import type { CmsContents } from "./types";
export const previewContents = new AsyncLocalStorage<CmsContents>();
