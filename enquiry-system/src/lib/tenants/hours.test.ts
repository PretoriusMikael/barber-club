import { test } from "node:test";
import assert from "node:assert/strict";
import { openStatus } from "./hours.ts";

const hours = {
  mon: [["08:00", "17:00"]], tue: [["08:00", "17:00"]], wed: [["08:00", "17:00"]],
  thu: [["08:00", "17:00"]], fri: [["08:00", "16:00"]], sat: [["08:00", "12:00"]], sun: [],
} as Parameters<typeof openStatus>[0];
const TZ = "Africa/Johannesburg"; // UTC+2, no DST

test("open during hours, in the tenant's time zone", () => {
  // Wed 2026-11-18 10:00 SAST = 08:00 UTC
  const s = openStatus(hours, TZ, new Date("2026-11-18T08:00:00Z"));
  assert.equal(s.isOpen, true);
  assert.match(s.summary, /until 17:00/);
});

test("closed before opening, opens later today", () => {
  const s = openStatus(hours, TZ, new Date("2026-11-18T04:30:00Z")); // 06:30 SAST
  assert.equal(s.isOpen, false);
  assert.match(s.summary, /today at 08:00/);
});

test("Saturday afternoon -> skips closed Sunday -> Monday", () => {
  const s = openStatus(hours, TZ, new Date("2026-11-21T13:00:00Z")); // Sat 15:00 SAST
  assert.equal(s.isOpen, false);
  assert.match(s.summary, /on Monday at 08:00/);
});

test("Friday evening -> tomorrow", () => {
  const s = openStatus(hours, TZ, new Date("2026-11-20T16:00:00Z")); // Fri 18:00 SAST
  assert.match(s.summary, /tomorrow at 08:00/);
});
