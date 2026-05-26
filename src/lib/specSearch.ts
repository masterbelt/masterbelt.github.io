import { getMarkdown, type Spec, specs } from "../data/specs";

type SearchResult = {
  id: string;
  terms: string[];
};

type SearchIndex = {
  search: (
    query: string,
    options: {
      boost: Record<string, number>;
      prefix: boolean;
    },
  ) => SearchResult[];
};

let searchIndexPromise: Promise<SearchIndex> | undefined;

export type SpecSearchResult = {
  excerpt: string;
  spec: Spec;
};

export async function searchSpecs(query: string, limit = 8): Promise<SpecSearchResult[]> {
  if (query.trim().length < 2) {
    return [];
  }

  const index = await loadSearchIndex();

  return index
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
    .filter((result): result is SpecSearchResult => Boolean(result));
}

function loadSearchIndex() {
  searchIndexPromise ??= Promise.all([import("minisearch"), fetch("/spec-search-index.json")]).then(
    async ([{ default: MiniSearch }, response]) =>
      MiniSearch.loadJSON(await response.text(), {
        fields: ["title", "path", "markdown"],
        idField: "path",
        storeFields: ["path"],
        searchOptions: {
          combineWith: "AND",
        },
      }),
  );

  return searchIndexPromise;
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
