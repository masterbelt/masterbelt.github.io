import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteUrl = "https://masterbelt.dev";
const distDir = new URL("../dist/", import.meta.url);
const manifestPath = new URL("../src/generated/spec-manifest.json", import.meta.url);

const htmlFiles = await collectHtmlFiles(distDir);
const htmlUrls = htmlFiles.map((file) => toUrl(file));
const specUrls = await readSpecUrls();
const markdownUrls = await readMarkdownUrls();
const llmsUrls = [new URL("/llms.txt", siteUrl).toString(), new URL("/llms-full.txt", siteUrl).toString()];
const urls = [...new Set([...htmlUrls, ...specUrls, ...markdownUrls, ...llmsUrls])].sort((a, b) => a.localeCompare(b));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

await fs.writeFile(new URL("sitemap.xml", distDir), sitemap);

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = new URL(entry.name, dir);

      if (entry.isDirectory()) {
        return collectHtmlFiles(new URL(`${entry.name}/`, dir));
      }

      if (entry.isFile() && entry.name.endsWith(".html")) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function toUrl(fileUrl) {
  const relativePath = path.posix.relative(toPosixPath(distDir), toPosixPath(fileUrl));
  const route = relativePath.replace(/(^|\/)index\.html$/, "$1");
  return new URL(route, siteUrl).toString();
}

function toPosixPath(fileUrl) {
  return fileURLToPath(fileUrl).split(path.sep).join(path.posix.sep);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function readSpecUrls() {
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    return manifest.specs.map((spec) => new URL(spec.route, siteUrl).toString());
  } catch {
    return [];
  }
}

async function readMarkdownUrls() {
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    return manifest.specs.map((spec) => new URL(spec.markdownUrl, siteUrl).toString());
  } catch {
    return [];
  }
}
