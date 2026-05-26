import manifest from "../generated/spec-manifest.json";

type SpecSection = {
  documents: {
    path: string;
    route: string;
    title: string;
  }[];
  index: number;
  title: string;
};

const manifestWithSections = manifest as typeof manifest & { sections?: SpecSection[] };
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
export const specSections = manifestWithSections.sections ?? [];
export const codeHighlights = codeHighlightModules["../generated/code-highlights.json"] ?? {};
export const specNavRows = buildSpecNavRows(specs, specSections);

export function getSelectedSpec(pathname: string) {
  if (pathname === "/spec" || pathname === "/spec/") {
    return specs.find((item) => item.route === "/spec/") ?? specs[0];
  }

  return specs.find((item) => item.route === pathname);
}

export function getMarkdown(spec: Spec | undefined) {
  return spec ? markdownModules[`../generated/spec/${spec.path}`] : undefined;
}

function buildSpecNavRows(items: Spec[], sections: SpecSection[]): SpecNavRow[] {
  if (sections.length > 0) {
    return buildSpecNavRowsFromSections(items, sections);
  }

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

function buildSpecNavRowsFromSections(items: Spec[], sections: SpecSection[]): SpecNavRow[] {
  const rows: SpecNavRow[] = [];
  const specsByPath = new Map(items.map((item) => [item.path, item]));

  for (const section of sections) {
    const firstDocument = section.documents[0];
    rows.push({
      type: "section",
      key: `section:${section.index}`,
      label: section.title,
      route: firstDocument?.route ?? "#",
      depth: 0,
    });

    for (const document of section.documents) {
      const spec = specsByPath.get(document.path);
      if (!spec) continue;

      rows.push({
        type: "spec",
        key: `spec:${spec.path}`,
        spec,
        depth: 1,
      });
    }
  }

  return rows;
}

function formatSegment(segment: string) {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
