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
  | { type: "section"; key: string; label: string; depth: number }
  | { type: "spec"; key: string; spec: Spec; depth: number };

export const specs = manifest.specs;
export const source = manifest.source;
export const codeHighlights = codeHighlightModules["../generated/code-highlights.json"] ?? {};
export const specNavRows = buildSpecNavRows(specs);

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
        rows.push({
          type: "section",
          key: `section:${key}`,
          label: formatSegment(segment),
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

function formatSegment(segment: string) {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
