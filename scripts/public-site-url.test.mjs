import assert from "node:assert/strict";
import test from "node:test";
import { resolvePublicUrl } from "../admin-app/lib/public-site-url.ts";

test("public page links preserve the GitHub Pages repository path", () => {
  assert.equal(resolvePublicUrl("/menu/", "https://token08.github.io/bassic/"), "https://token08.github.io/bassic/menu/");
  assert.equal(resolvePublicUrl("/", "https://token08.github.io/bassic/"), "https://token08.github.io/bassic/");
  assert.equal(resolvePublicUrl("/bassic/assets/pdf/list.pdf", "https://token08.github.io/bassic/"), "https://token08.github.io/bassic/assets/pdf/list.pdf");
});

test("public page links work at the production domain and preserve external URLs", () => {
  assert.equal(resolvePublicUrl("/access/", "https://www.bassic.jp/"), "https://www.bassic.jp/access/");
  assert.equal(resolvePublicUrl("https://example.com/menu.pdf", "https://token08.github.io/bassic/"), "https://example.com/menu.pdf");
});
