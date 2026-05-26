import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoArg = process.argv[2] ?? "../masterbelt";
const repoDir = path.resolve(process.cwd(), repoArg);
const specDir = path.join(repoDir, "spec");
const sourceManifestPath = path.join(specDir, "manifest.json");
const syntaxDir = path.join(repoDir, "internal/masterbelt/syntax");
const treeSitterCli = path.join(syntaxDir, "node_modules/.bin/tree-sitter");
const outputDir = path.resolve(process.cwd(), "src/generated/spec");
const manifestPath = path.resolve(process.cwd(), "src/generated/spec-manifest.json");
const highlightsPath = path.resolve(process.cwd(), "src/generated/code-highlights.json");
const excludedNames = new Set(["AGENTS.md", "CLAUDE.md"]);

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(highlightsPath), { recursive: true });

const sourceManifest = await readSourceManifest(sourceManifestPath);
const manifestDocuments = sourceManifest ? flattenManifestDocuments(sourceManifest) : [];
const manifestDocumentsByPath = new Map(manifestDocuments.map((document) => [document.path, document]));
const files = await collectMarkdownFiles(specDir);
const markdownPaths = files.map((filePath) => toPosix(path.relative(specDir, filePath)));
validateSourceManifest(sourceManifest, markdownPaths);
const commit = await gitOutput(repoDir, ["rev-parse", "HEAD"]);
const shortCommit = await gitOutput(repoDir, ["rev-parse", "--short", "HEAD"]);
const syncedAt = new Date().toISOString();

const specs = [];
const codeHighlights = {};

for (const sourcePath of files) {
  const relativePath = toPosix(path.relative(specDir, sourcePath));
  const content = await fs.readFile(sourcePath, "utf8");
  const outputPath = path.join(outputDir, relativePath);
  const slug = slugFromPath(relativePath);
  const manifestDocument = manifestDocumentsByPath.get(relativePath);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);

  specs.push({
    title: manifestDocument?.title ?? extractTitle(content) ?? titleFromPath(relativePath),
    slug,
    path: relativePath,
    route: slug ? `/spec/${slug}/` : "/spec/",
    markdownUrl: `/spec-src/${relativePath}`,
    sourceUrl: `https://github.com/masterbelt/masterbelt/blob/main/spec/${relativePath}`,
    segments: slug ? slug.split("/") : [],
    sectionTitle: manifestDocument?.sectionTitle ?? sectionTitleFromPath(relativePath),
    sectionIndex: manifestDocument?.sectionIndex ?? 999999,
    documentIndex: manifestDocument?.documentIndex ?? 999999,
  });

  const highlightedBlocks = await highlightMasterbeltBlocks(content);

  if (highlightedBlocks.length > 0) {
    codeHighlights[relativePath] = highlightedBlocks;
  }
}

const manifest = {
  source: {
    repository: "masterbelt/masterbelt",
    branch: "main",
    commit,
    shortCommit,
    syncedAt,
  },
  title: sourceManifest?.title ?? "Masterbelt Specification",
  description: sourceManifest?.description,
  sections: buildGeneratedSections(sourceManifest, specs),
  specs,
};

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(highlightsPath, `${JSON.stringify(codeHighlights, null, 2)}\n`);

console.log(`Synced ${specs.length} spec files from ${repoDir}`);

async function collectMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectMarkdownFiles(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith(".md") && !excludedNames.has(entry.name)) {
        return [entryPath];
      }

      return [];
    }),
  );

  return nested.flat().sort(compareSpecPaths);
}

async function readSourceManifest(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

function validateSourceManifest(sourceManifest, markdownPaths) {
  if (!sourceManifest) {
    throw new Error(`Missing source spec manifest: ${sourceManifestPath}`);
  }

  if (!Array.isArray(sourceManifest.sections) || sourceManifest.sections.length === 0) {
    throw new Error("Source spec manifest must contain a non-empty sections array");
  }

  const markdownPathSet = new Set(markdownPaths);
  const manifestPathSet = new Set();
  const errors = [];

  for (const [sectionIndex, section] of sourceManifest.sections.entries()) {
    if (!section.title) {
      errors.push(`sections[${sectionIndex}] is missing title`);
    }

    if (!Array.isArray(section.documents) || section.documents.length === 0) {
      errors.push(`sections[${sectionIndex}] must contain at least one document`);
      continue;
    }

    for (const [documentIndex, document] of section.documents.entries()) {
      const location = `sections[${sectionIndex}].documents[${documentIndex}]`;

      if (!document.path) {
        errors.push(`${location} is missing path`);
        continue;
      }

      if (!document.path.endsWith(".md")) {
        errors.push(`${location} path must point to a markdown file: ${document.path}`);
      }

      if (!document.title) {
        errors.push(`${location} is missing title`);
      }

      if (manifestPathSet.has(document.path)) {
        errors.push(`${location} duplicates ${document.path}`);
      }

      manifestPathSet.add(document.path);

      if (!markdownPathSet.has(document.path)) {
        errors.push(`${location} references missing file ${document.path}`);
      }
    }
  }

  for (const markdownPath of markdownPaths) {
    if (!manifestPathSet.has(markdownPath)) {
      errors.push(`manifest is missing ${markdownPath}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid source spec manifest:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function flattenManifestDocuments(sourceManifest) {
  return sourceManifest.sections.flatMap((section, sectionIndex) =>
    section.documents.map((document, documentIndex) => ({
      ...document,
      sectionTitle: section.title,
      sectionIndex,
      documentIndex,
    })),
  );
}

function buildGeneratedSections(sourceManifest, generatedSpecs) {
  if (!sourceManifest) {
    return [];
  }

  const specsByPath = new Map(generatedSpecs.map((spec) => [spec.path, spec]));

  return sourceManifest.sections
    .map((section, sectionIndex) => ({
      title: section.title,
      index: sectionIndex,
      documents: section.documents
        .map((document, documentIndex) => {
          const spec = specsByPath.get(document.path);
          if (!spec) return undefined;

          return {
            path: spec.path,
            title: spec.title,
            route: spec.route,
            index: documentIndex,
          };
        })
        .filter(Boolean),
    }))
    .filter((section) => section.documents.length > 0);
}

async function gitOutput(cwd, args) {
  const { stdout } = await execFileAsync("git", args, { cwd });
  return stdout.trim();
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1].trim();
}

function titleFromPath(filePath) {
  return filePath
    .replace(/\.md$/, "")
    .replace(/(^|\/)README$/, "$1overview")
    .split("/")
    .at(-1)
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function toPosix(value) {
  return value.split(path.sep).join(path.posix.sep);
}

async function highlightMasterbeltBlocks(content) {
  const blocks = [];
  const fencePattern = /^```(\w+)\n([\s\S]*?)^```/gm;
  let match = fencePattern.exec(content);

  while (match) {
    if (match[1] !== "mst") {
      match = fencePattern.exec(content);
      continue;
    }

    blocks.push(await highlightMasterbeltCode(match[2].replace(/\n$/, "")));
    match = fencePattern.exec(content);
  }

  return blocks;
}

async function highlightMasterbeltCode(code) {
  try {
    await fs.access(treeSitterCli);

    const tempDir = await fs.mkdtemp(path.join("/tmp", "masterbelt-highlight-"));
    const tempFile = path.join(tempDir, "input.mst");
    await fs.writeFile(tempFile, code);

    const { stdout } = await execFileAsync(
      treeSitterCli,
      ["highlight", "--html", "--css-classes", "--grammar-path", syntaxDir, tempFile],
      {
        env: {
          ...process.env,
          XDG_CACHE_HOME: path.join("/tmp", "tree-sitter-cache"),
        },
      },
    );

    await fs.rm(tempDir, { recursive: true, force: true });
    return extractHighlightedLines(stdout) ?? null;
  } catch {
    return null;
  }
}

function extractHighlightedLines(html) {
  const lines = [...html.matchAll(/<td class=line>([\s\S]*?)<\/td>/g)].map((match) => match[1]);

  if (lines.length === 0) {
    return null;
  }

  return lines.join("");
}

function slugFromPath(filePath) {
  if (filePath === "README.md") {
    return "";
  }

  return filePath.replace(/\.md$/, "");
}

function compareSpecPaths(left, right) {
  const leftRelative = toPosix(path.relative(specDir, left));
  const rightRelative = toPosix(path.relative(specDir, right));
  const leftDocument = manifestDocumentsByPath.get(leftRelative);
  const rightDocument = manifestDocumentsByPath.get(rightRelative);

  if (leftDocument && rightDocument) {
    if (leftDocument.sectionIndex !== rightDocument.sectionIndex) {
      return leftDocument.sectionIndex - rightDocument.sectionIndex;
    }

    if (leftDocument.documentIndex !== rightDocument.documentIndex) {
      return leftDocument.documentIndex - rightDocument.documentIndex;
    }
  }

  if (leftDocument) return -1;
  if (rightDocument) return 1;

  return leftRelative.localeCompare(rightRelative);
}

function sectionTitleFromPath(filePath) {
  if (filePath === "README.md") {
    return "Overview";
  }

  const [segment] = filePath.split("/");
  return titleFromPath(segment);
}
