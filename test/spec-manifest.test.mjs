import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await fs.readFile(path.join(rootDir, "src/generated/spec-manifest.json"), "utf8"));

test("generated spec sections define the spec reading order", () => {
  const sectionPaths = manifest.sections.flatMap((section) => section.documents.map((document) => document.path));
  const specPaths = manifest.specs.map((spec) => spec.path);

  assert.deepEqual(specPaths, sectionPaths);
});

test("generated spec manifest has unique paths and routes", () => {
  const specPaths = manifest.specs.map((spec) => spec.path);
  const specRoutes = manifest.specs.map((spec) => spec.route);
  const sectionPaths = manifest.sections.flatMap((section) => section.documents.map((document) => document.path));

  assert.equal(new Set(specPaths).size, specPaths.length);
  assert.equal(new Set(specRoutes).size, specRoutes.length);
  assert.equal(new Set(sectionPaths).size, sectionPaths.length);
});

test("generated spec sections reference existing specs with matching titles", () => {
  const specsByPath = new Map(manifest.specs.map((spec) => [spec.path, spec]));

  for (const [sectionIndex, section] of manifest.sections.entries()) {
    assert.ok(section.title);
    assert.equal(section.index, sectionIndex);

    for (const [documentIndex, document] of section.documents.entries()) {
      const spec = specsByPath.get(document.path);
      assert.ok(spec, `${document.path} is missing from specs`);
      assert.equal(spec.title, document.title);
      assert.equal(spec.route, document.route);
      assert.equal(spec.sectionTitle, section.title);
      assert.equal(spec.sectionIndex, sectionIndex);
      assert.equal(spec.documentIndex, documentIndex);
      assert.equal(document.index, documentIndex);
    }
  }
});
