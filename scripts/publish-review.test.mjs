import test from "node:test";
import assert from "node:assert/strict";
import {
  summarizeVisualChanges,
  withVisualHistory,
  visualHistory,
} from "../admin-app/lib/publish-review.ts";
const empty = () => ({ version: 1, shared: { nodes: {} }, pages: {} });
const node = { id: "heading", tag: "h2", texts: { 0: "現在の見出し" } };
test("review ignores revision/history, key order and empty overrides", () => {
  const a = empty(),
    b = {
      ...empty(),
      revision: "new",
      savedAt: "2026-11-12T00:00:00Z",
      previous: a,
    };
  b.pages["/"] = { nodes: {} };
  b.shared.nodes.heading = { style: {} };
  assert.deepEqual(summarizeVisualChanges(a, b, [node], "/"), []);
});
test("review preserves intentional blanks and shows standard restoration accurately", () => {
  const a = empty(),
    b = empty();
  b.pages["/"] = { nodes: { heading: { texts: { 0: "" } } } };
  const details = summarizeVisualChanges(a, b, [node], "/")[0].details;
  assert.equal(details[0].before, "現在の見出し");
  assert.equal(details[0].after, "空欄");
  const restored = summarizeVisualChanges(b, a, [node], "/")[0].details[0];
  assert.equal(restored.before, "空欄");
  assert.equal(restored.after, "現在の見出し");
});
test("review separates shared scope, other pages and translations", () => {
  const a = empty(),
    b = empty();
  b.shared.theme = { red: "#123456" };
  b.pages["/en/menu/"] = {
    nodes: { photo: { attrs: { src: "" } } },
    meta: { title: "English" },
  };
  const groups = summarizeVisualChanges(a, b, [], "/");
  assert.equal(groups[0].label, "全ページ共通（全言語）");
  assert.equal(groups[1].label, "MENU（英語）");
  assert.deepEqual(
    groups[1].details.map((item) => item.kind),
    ["写真・ロゴ", "検索・共有表示"],
  );
});
test("one added card is not expanded into many default-field changes", () => {
  const a = empty(),
    b = empty();
  b.pages["/"] = {
    nodes: {
      grid: { copies: [{ id: "grid.copy-1", source: "grid.card" }] },
      "grid.copy-1": { texts: { 0: "copy" } },
      "grid.copy-1.image": { attrs: { src: "/photo.jpg" } },
    },
  };
  assert.equal(summarizeVisualChanges(a, b, [], "/")[0].details.length, 1);
});
test("history keeps three previous snapshots without modifying the inputs", () => {
  let state = empty();
  for (let i = 1; i <= 6; i++) {
    const input = state;
    const before = structuredClone(input);
    state = withVisualHistory(
      { ...empty(), revision: String(i), savedAt: "2026-11-12T00:00:00Z" },
      input,
    );
    assert.deepEqual(input, before);
  }
  assert.deepEqual(
    visualHistory(state).map((item) => item.revision),
    ["5", "4", "3"],
  );
  const frozen = structuredClone(state);
  withVisualHistory({ ...empty(), revision: "7" }, state);
  assert.deepEqual(state, frozen);
});
test("large history drops oldest copies to stay inside the storage limit", () => {
  let state = empty();
  for (let i = 0; i < 4; i++) {
    const next = empty();
    next.revision = String(i);
    next.pages["/"] = {
      nodes: { heading: { texts: { 0: "x".repeat(2000) } } },
    };
    state = withVisualHistory(next, state);
  }
  const current = empty();
  current.revision = "next";
  const result = withVisualHistory(current, state, 2500);
  assert.ok(JSON.stringify(result).length <= 2500);
  assert.equal(visualHistory(result).length, 1);
  assert.throws(() => withVisualHistory(state, state, 100), /大きすぎ/);
});
