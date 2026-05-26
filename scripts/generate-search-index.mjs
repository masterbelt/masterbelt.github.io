import { promises as fs } from "node:fs";
import path from "node:path";
import MiniSearch from "minisearch";

const rootDir = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(rootDir, "src/generated/spec-manifest.json");
const specDir = path.join(rootDir, "src/generated/spec");
const searchIndexPath = path.join(rootDir, "public/spec-search-index.json");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const index = new MiniSearch({
  fields: ["title", "path", "markdown"],
  idField: "path",
  storeFields: ["path"],
  searchOptions: {
    combineWith: "AND",
  },
});

index.addAll(
  await Promise.all(
    manifest.specs.map(async (spec) => {
      const markdown = await fs.readFile(path.join(specDir, spec.path), "utf8");

      return {
        path: spec.path,
        title: spec.title,
        markdown,
      };
    }),
  ),
);

await fs.mkdir(path.dirname(searchIndexPath), { recursive: true });
await fs.writeFile(searchIndexPath, `${JSON.stringify(index, null, 2)}\n`);

console.log(`Generated search index for ${manifest.specs.length} spec files`);
