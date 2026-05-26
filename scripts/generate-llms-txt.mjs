import { promises as fs } from "node:fs";

const siteUrl = "https://masterbelt.dev";
const distDir = new URL("../dist/", import.meta.url);
const manifestPath = new URL("../src/generated/spec-manifest.json", import.meta.url);
const generatedSpecDir = new URL("../src/generated/spec/", import.meta.url);

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const specs = manifest.specs;

await fs.writeFile(new URL("llms.txt", distDir), buildLlmsTxt(specs));
await fs.writeFile(new URL("llms-full.txt", distDir), await buildLlmsFullTxt(specs));

function buildLlmsTxt(items) {
  return [
    "# Masterbelt",
    "",
    "> Masterbelt language and tooling specifications.",
    "",
    `Canonical site: ${siteUrl}/`,
    `Specification index: ${new URL("/spec/", siteUrl).toString()}`,
    "",
    "## Specification Markdown",
    "",
    ...items.map((spec) => `- ${spec.title}: ${new URL(spec.markdownUrl, siteUrl).toString()}`),
    "",
    "## Specification HTML",
    "",
    ...items.map((spec) => `- ${spec.title}: ${new URL(spec.route, siteUrl).toString()}`),
    "",
  ].join("\n");
}

async function buildLlmsFullTxt(items) {
  const sections = await Promise.all(
    items.map(async (spec) => {
      const markdown = await fs.readFile(new URL(spec.path, generatedSpecDir), "utf8");
      const sourceUrl = new URL(spec.markdownUrl, siteUrl).toString();

      return [`# ${spec.title}`, "", `Source: ${sourceUrl}`, "", normalizeMarkdown(markdown), ""].join("\n");
    }),
  );

  return [
    "# Masterbelt Full Specification",
    "",
    "> Full text export for LLM context. Prefer source URLs for citation.",
    "",
    `Canonical site: ${siteUrl}/`,
    "",
    ...sections,
  ].join("\n");
}

function normalizeMarkdown(markdown) {
  return markdown.trim().replace(/\r\n/g, "\n");
}
