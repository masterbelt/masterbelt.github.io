import assert from "node:assert/strict";
import test from "node:test";
import { compareSpecRelativePaths } from "../scripts/spec-order.mjs";

test("compareSpecRelativePaths orders specs by reader flow", () => {
  const unordered = [
    "tooling/tags.md",
    "codegen/typescript.md",
    "language/std.md",
    "masterdata/export-msgpack.md",
    "language/diagnostics.md",
    "compatibility.md",
    "masterdata/query.md",
    "tooling/configuration.md",
    "README.md",
    "codegen/model.md",
    "language/lexical.md",
    "masterdata/schema.md",
    "language/syntax.md",
    "tooling/cli.md",
    "codegen/runtime.md",
  ];

  assert.deepEqual(unordered.sort(compareSpecRelativePaths), [
    "README.md",
    "language/lexical.md",
    "language/syntax.md",
    "language/diagnostics.md",
    "language/std.md",
    "masterdata/schema.md",
    "masterdata/query.md",
    "masterdata/export-msgpack.md",
    "codegen/model.md",
    "codegen/runtime.md",
    "codegen/typescript.md",
    "tooling/configuration.md",
    "tooling/cli.md",
    "tooling/tags.md",
    "compatibility.md",
  ]);
});

test("compareSpecRelativePaths keeps unknown files near their section", () => {
  const unordered = ["language/zzz.md", "unknown/a.md", "language/lexical.md", "codegen/aaa.md"];

  assert.deepEqual(unordered.sort(compareSpecRelativePaths), [
    "language/lexical.md",
    "language/zzz.md",
    "codegen/aaa.md",
    "unknown/a.md",
  ]);
});
