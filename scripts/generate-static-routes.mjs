import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildSpecMetadata, withPageMetadata, withRenderedApp } from "./static-site.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const indexPath = path.join(distDir, "index.html");
const serverDir = path.join(distDir, "server");
const serverEntryPath = path.join(serverDir, "entry-server.js");
const manifestPath = path.join(rootDir, "src/generated/spec-manifest.json");
const generatedSpecDir = path.join(rootDir, "src/generated/spec");
const publicSpecDir = path.join(distDir, "spec-src");

const indexHtml = await fs.readFile(indexPath, "utf8");
const { render } = await import(pathToFileURL(serverEntryPath));
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const siteUrl = "https://masterbelt.dev";

const homeHtml = render("/");
await fs.writeFile(indexPath, withRenderedApp(indexHtml, homeHtml));

for (const spec of manifest.specs) {
  const routeDir = path.join(distDir, spec.route);
  const markdown = await fs.readFile(path.join(generatedSpecDir, spec.path), "utf8");
  const appHtml = render(spec.route);
  const html = withRenderedApp(withPageMetadata(indexHtml, buildSpecMetadata({ siteUrl, spec, markdown })), appHtml);

  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(path.join(routeDir, "index.html"), html);
}

await fs.rm(publicSpecDir, { recursive: true, force: true });
await fs.mkdir(publicSpecDir, { recursive: true });

for (const spec of manifest.specs) {
  const sourcePath = path.join(generatedSpecDir, spec.path);
  const targetPath = path.join(publicSpecDir, spec.path);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

await fs.rm(serverDir, { recursive: true, force: true });

console.log(`Generated ${manifest.specs.length} static spec routes`);
