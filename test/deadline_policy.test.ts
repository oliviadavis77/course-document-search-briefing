import assert from "node:assert/strict";
import test from "node:test";
import { deadlineState } from "../src/deadline_policy.js";

test("marks a learner due soon inside the educator's 48-hour review window", () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  assert.equal(deadlineState("2026-08-21T17:00:00.000Z", now), "due-soon");
});

test("marks a missed learner deadline overdue", () => {
  const now = new Date("2026-08-22T09:00:00.000Z");
  assert.equal(deadlineState("2026-08-21T17:00:00.000Z", now), "overdue");
});
