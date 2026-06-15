import { rmSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve("admin-app/.next");

if (!target.endsWith(resolve("admin-app/.next"))) {
  throw new Error("Refusing to remove unexpected path.");
}

rmSync(target, { force: true, recursive: true });
console.log("Removed admin-app/.next");
