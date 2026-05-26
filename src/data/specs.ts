import MiniSearch from "minisearch";
import manifest from "../generated/spec-manifest.json";

const markdownModules = import.meta.glob("../generated/spec/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const codeHighlightModules = import.meta.glob("../generated/code-highlights.json", {
  import: "default",
  eager: true,
}) as Record<string, Record<string, (string | null)[]>>;

export type Spec = (typeof manifest.specs)[number];

export type SpecNavRow =
  | { type: "section"; key: string; label: string; route: string; depth: number }
  | { type: "spec"; key: string; spec: Spec; depth: number };

export const specs = manifest.specs;
export const source = manifest.source;
export const codeHighlights = codeHighlightModules["../generated/code-highlights.json"] ?? {};
export const specNavRows = buildSpecNavRows(specs);
const specSearchIndex = buildSpecSearchIndex();

export function searchSpecs(query: string, limit = 8) {
  if (query.trim().length < 2) {
    return [];
  }

  return specSearchIndex
    .search(query, {
      boost: {
        title: 4,
        path: 2,
      },
      prefix: true,
    })
    .slice(0, limit)
    .map((result) => {
      const spec = specs.find((item) => item.path === result.id);
      if (!spec) return undefined;

      return {
        spec,
        excerpt: excerptSpecSearchResult(getMarkdown(spec) ?? "", result.terms),
      };
    })
    .filter((result): result is NonNullable<typeof result> => Boolean(result));
}

export function getSelectedSpec(pathname: string) {
  if (pathname === "/spec" || pathname === "/spec/") {
    return specs.find((item) => item.route === "/spec/") ?? specs[0];
  }

  return specs.find((item) => item.route === pathname);
}

export function getMarkdown(spec: Spec | undefined) {
  return spec ? markdownModules[`../generated/spec/${spec.path}`] : undefined;
}

function buildSpecNavRows(items: Spec[]): SpecNavRow[] {
  const rows: SpecNavRow[] = [];
  const seenSections = new Set<string>();

  for (const item of items) {
    const directories = item.segments.slice(0, -1);

    directories.forEach((segment, index) => {
      const key = directories.slice(0, index + 1).join("/");

      if (!seenSections.has(key)) {
        seenSections.add(key);
        const firstSpec = items.find((candidate) => candidate.segments.slice(0, index + 1).join("/") === key);
        rows.push({
          type: "section",
          key: `section:${key}`,
          label: formatSegment(segment),
          route: firstSpec?.route ?? "#",
          depth: index,
        });
      }
    });

    rows.push({
      type: "spec",
      key: `spec:${item.path}`,
      spec: item,
      depth: directories.length,
    });
  }

  return rows;
}

function buildSpecSearchIndex() {
  const index = new MiniSearch({
    fields: ["title", "path", "markdown"],
    idField: "path",
    storeFields: ["path"],
    searchOptions: {
      combineWith: "AND",
    },
  });

  index.addAll(
    specs.map((spec) => ({
      path: spec.path,
      title: spec.title,
      markdown: getMarkdown(spec) ?? "",
    })),
  );

  return index;
}

function excerptSpecSearchResult(markdown: string, terms: string[]) {
  const line =
    markdown
      .split("\n")
      .map((value) => value.trim())
      .find((value) => {
        const normalized = normalizeSearch(value);
        return value && !value.startsWith("#") && terms.some((term) => normalized.includes(term));
      }) ?? "";

  return line.length > 140 ? `${line.slice(0, 137)}...` : line;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase();
}

function formatSegment(segment: string) {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
