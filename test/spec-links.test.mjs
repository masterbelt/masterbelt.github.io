import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import GithubSlugger from "github-slugger";

const rootDir = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await fs.readFile(path.join(rootDir, "src/generated/spec-manifest.json"), "utf8"));
const specDir = path.join(rootDir, "src/generated/spec");
const specsByPath = new Map(manifest.specs.map((spec) => [spec.path, spec]));
const markdownByPath = new Map();
const headingIdsByPath = new Map();
const knownBrokenLinks = new Set([
  "language/builtins.md: #reserved-built-in-names -> missing #reserved-built-in-names in language/builtins.md",
  "masterdata/schema.md: #scope-chaining -> missing #scope-chaining in masterdata/schema.md",
  "masterdata/schema.md: export-sqlite.md#indexed-scope-secondary-indexes -> missing #indexed-scope-secondary-indexes in masterdata/export-sqlite.md",
]);

for (const spec of manifest.specs) {
  const markdown = await fs.readFile(path.join(specDir, spec.path), "utf8");
  markdownByPath.set(spec.path, markdown);
  headingIdsByPath.set(spec.path, extractHeadingIds(markdown));
}

test("spec markdown links point to existing generated spec pages and headings", () => {
  const brokenLinks = [];

  for (const spec of manifest.specs) {
    const markdown = markdownByPath.get(spec.path);
    for (const href of extractMarkdownLinks(markdown)) {
      const resolved = resolveSpecHref(href, spec.path);
      if (!resolved) continue;

      if (!specsByPath.has(resolved.path)) {
        addBrokenLink(brokenLinks, `${spec.path}: ${href} -> missing ${resolved.path}`);
        continue;
      }

      if (resolved.hash && !headingIdsByPath.get(resolved.path)?.has(resolved.hash)) {
        addBrokenLink(brokenLinks, `${spec.path}: ${href} -> missing #${resolved.hash} in ${resolved.path}`);
      }
    }
  }

  assert.deepEqual(brokenLinks, []);
});

function extractMarkdownLinks(markdown) {
  const links = [];
  const pattern = /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match = pattern.exec(markdown);

  while (match) {
    links.push(match[1]);
    match = pattern.exec(markdown);
  }

  return links;
}

function addBrokenLink(brokenLinks, message) {
  if (!knownBrokenLinks.has(message)) {
    brokenLinks.push(message);
  }
}

function resolveSpecHref(href, currentPath) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/")) {
    return undefined;
  }

  const [pathPart, hashPart] = href.split("#", 2);
  const hash = hashPart ? new GithubSlugger().slug(decodeURIComponent(hashPart)) : "";

  if (!pathPart) {
    return { path: currentPath, hash };
  }

  if (!pathPart.endsWith(".md")) {
    return undefined;
  }

  const currentDirectory = currentPath.split("/").slice(0, -1);
  const targetParts = [...currentDirectory, ...pathPart.split("/")];
  const normalizedParts = [];

  for (const part of targetParts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      normalizedParts.pop();
      continue;
    }
    normalizedParts.push(part);
  }

  return {
    path: normalizedParts.join("/"),
    hash,
  };
}

function extractHeadingIds(markdown) {
  const slugger = new GithubSlugger();
  const ids = new Set();
  const pattern = /^(#{1,6})\s+(.+)$/gm;
  let match = pattern.exec(markdown);

  while (match) {
    ids.add(slugger.slug(stripMarkdownInline(match[2].trim())));
    match = pattern.exec(markdown);
  }

  return ids;
}

function stripMarkdownInline(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, "$1");
}
