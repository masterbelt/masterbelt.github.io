import GithubSlugger from "github-slugger";
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
  section?: {
    id: string;
    text: string;
  };
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
        ...summarizeSpecSearchResult(getMarkdown(spec) ?? "", result.terms),
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

function summarizeSpecSearchResult(markdown: string, terms: string[]): Pick<SpecSearchResult, "excerpt" | "section"> {
  const slugger = new GithubSlugger();
  let currentSection: SpecSearchResult["section"];

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);

    if (heading) {
      const text = stripMarkdownInline(heading[2].trim());
      const section = {
        id: slugger.slug(text),
        text,
      };

      if (heading[1].length > 1) {
        currentSection = section;
      }

      if (matchesSearchTerms(text, terms)) {
        return {
          excerpt: text,
          section: heading[1].length > 1 ? section : undefined,
        };
      }

      continue;
    }

    if (line && matchesSearchTerms(line, terms)) {
      return {
        excerpt: truncateExcerpt(line),
        section: currentSection,
      };
    }
  }

  return { excerpt: "" };
}

function matchesSearchTerms(value: string, terms: string[]) {
  const normalized = normalizeSearch(value);
  return terms.some((term) => normalized.includes(term));
}

function truncateExcerpt(value: string) {
  return value.length > 140 ? `${value.slice(0, 137)}...` : value;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase();
}

function stripMarkdownInline(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, "$1");
}
