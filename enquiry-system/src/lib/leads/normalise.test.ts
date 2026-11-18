import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseEmail, normalisePhone, verifyContact } from "./normalise.ts";

test("normalisePhone: South African formats collapse to one E.164 value", () => {
  for (const input of ["082 123 4567", "0821234567", "+27 82 123 4567", "27821234567", "0027 82-123-4567", "(082) 123 4567"]) {
    assert.equal(normalisePhone(input), "+27821234567", input);
  }
});

test("normalisePhone: rejects junk and wrong-length SA numbers", () => {
  for (const input of ["", "12345", "082 123 456", "abc", "821234567", "+27 82 123 45678"]) {
    assert.equal(normalisePhone(input), null, input);
  }
});

test("normalisePhone: keeps other international numbers", () => {
  assert.equal(normalisePhone("+44 20 7946 0958"), "+442079460958");
});

test("normaliseEmail", () => {
  assert.equal(normaliseEmail("  Thandi@Example.CO.ZA "), "thandi@example.co.za");
  assert.equal(normaliseEmail("not-an-email"), null);
});

test("verifyContact: accepts details the visitor typed, in any format", () => {
  const typed = "Hi, I'm Thandi. Call me on 082 123 4567 or thandi@example.com";
  const result = verifyContact({ name: "Thandi", email: "THANDI@example.com", phone: "+27821234567" }, typed);
  assert.deepEqual(result, { name: "Thandi", email: "thandi@example.com", phone: "+27821234567" });
});

test("verifyContact: drops details the model invented or 'corrected'", () => {
  const typed = "My number is 082 123 4567";
  const result = verifyContact({ name: "John", email: "john@example.com", phone: "0821234568" }, typed);
  assert.deepEqual(result, { name: null, email: null, phone: null });
});
