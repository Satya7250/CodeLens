import assert from "node:assert/strict";
import test from "node:test";

import { isValidRepositoryId } from "./validate-repository-id.ts";

test("accepts UUID repository IDs", () => {
  assert.equal(isValidRepositoryId("123e4567-e89b-12d3-a456-426614174000"), true);
});

test("rejects malformed repository IDs", () => {
  assert.equal(isValidRepositoryId("not-a-uuid"), false);
  assert.equal(isValidRepositoryId("123e4567-e89b-12d3-a456"), false);
});
