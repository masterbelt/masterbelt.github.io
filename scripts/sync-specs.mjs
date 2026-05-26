import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoArg = process.argv[2] ?? "../masterbelt";
const repoDir = path.resolve(process.cwd(), repoArg);
const specDir = path.join(repoDir, "spec");
const syntaxDir = path.join(repoDir, "internal/masterbelt/syntax");
const treeSitterCli = path.join(syntaxDir, "node_modules/.bin/tree-sitter");
const outputDir = path.resolve(process.cwd(), "src/generated/spec");
const manifestPath = path.resolve(process.cwd(), "src/generated/spec-manifest.json");
const highlightsPath = path.resolve(process.cwd(), "src/generated/code-highlights.json");
const excludedNames = new Set(["AGENTS.md", "CLAUDE.md"]);

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.dirname(highlightsPath), { recursive: true });

const files = await collectMarkdownFiles(specDir);
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

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content);

  specs.push({
    title: extractTitle(content) ?? titleFromPath(relativePath),
    slug,
    path: relativePath,
    route: slug ? `/spec/${slug}/` : "/spec/",
    markdownUrl: `/spec-src/${relativePath}`,
    sourceUrl: `https://github.com/masterbelt/masterbelt/blob/main/spec/${relativePath}`,
    segments: slug ? slug.split("/") : [],
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

  if (leftRelative === "README.md") {
    return -1;
  }

  if (rightRelative === "README.md") {
    return 1;
  }

  return leftRelative.localeCompare(rightRelative);
}
