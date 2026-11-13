import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeEventForStorage, decodeEventFromStorage } from "../lib/event-storage.mjs";

test("Facebook poster URLs round-trip without using the CMS image field", () => {
  const event = { title: "Live", sourceType: "facebook", sourceId: "12345678", date: "2026-12-12", startTime: "19:00", image: { url: "https://lookaside.fbsbx.com/poster?a=1&b=2", alt: "出演者" } };
  const stored = encodeEventForStorage(event);
  assert.equal(stored.image, null);
  assert.equal(stored.date, "2026-12-12T00:00:00.000Z");
  assert.deepEqual(decodeEventFromStorage(stored), event);
  assert.equal(event.date,"2026-12-12", "Serialization must not mutate the editor input");
});
test("CMS-uploaded posters are written as URLs and remain readable", () => {
  const url="https://images.microcms-assets.io/assets/service/poster.png";
  assert.equal(encodeEventForStorage({image:{url},sourceType:"facebook"}).image,url);
  assert.deepEqual(decodeEventFromStorage({image:{url},sourceType:"facebook"}).image,{url});
});
test("Removing a poster or using an image-free event never restores defaults", () => {
  const event={date:"2026-12-12",sourceType:"facebook",image:null};
  assert.deepEqual(decodeEventFromStorage(encodeEventForStorage(event)),event);
  assert.deepEqual(encodeEventForStorage({startTime:"20:00"}),{startTime:"20:00"},"Partial updates must not clear an absent image");
});
test("Legacy plain fields and malformed metadata remain readable", () => {
  const legacy={sourceType:"facebook",image:{url:"/poster.png"},date:"2026-12-12T00:00:00.000Z"};
  assert.equal(decodeEventFromStorage(legacy).date,"2026-12-12");
  assert.equal(decodeEventFromStorage({date:"2026-12-11T15:00:00.000Z"}).date,"2026-12-12", "Legacy UTC dates must retain the Japanese calendar day");
  assert.deepEqual(decodeEventFromStorage({sourceType:"bassic-event-v1:{bad"}),{sourceType:"bassic-event-v1:{bad"});
});
