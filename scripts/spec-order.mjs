const topLevelOrder = new Map([
  ["README.md", 0],
  ["language", 1],
  ["masterdata", 2],
  ["codegen", 3],
  ["tooling", 4],
  ["compatibility.md", 5],
]);

const nestedOrder = {
  language: [
    "lexical.md",
    "syntax.md",
    "modules.md",
    "names.md",
    "builtins.md",
    "types.md",
    "semantics.md",
    "evaluation.md",
    "ir.md",
    "diagnostics.md",
    "std.md",
  ],
  masterdata: [
    "schema.md",
    "keys.md",
    "relations.md",
    "validation.md",
    "query.md",
    "import-csv.md",
    "import-xlsx.md",
    "export-json.md",
    "export-sqlite.md",
    "export-msgpack.md",
  ],
  codegen: ["model.md", "runtime.md", "golang.md", "typescript.md", "csharp.md"],
  tooling: ["configuration.md", "cli.md", "formatter.md", "linter.md", "lsp.md", "highlighting.md", "tags.md"],
};

export function compareSpecRelativePaths(left, right) {
  const leftParts = left.split("/");
  const rightParts = right.split("/");
  const leftTop = leftParts[0];
  const rightTop = rightParts[0];
  const topComparison = compareByOrder(topLevelOrder, leftTop, rightTop);

  if (topComparison !== 0) {
    return topComparison;
  }

  if (leftTop !== rightTop) {
    return left.localeCompare(right);
  }

  const order = nestedOrder[leftTop];
  if (!order) {
    return left.localeCompare(right);
  }

  return compareByOrder(
    new Map(order.map((name, index) => [name, index])),
    leftParts.slice(1).join("/"),
    rightParts.slice(1).join("/"),
  );
}

function compareByOrder(order, left, right) {
  const leftOrder = order.get(left) ?? Number.POSITIVE_INFINITY;
  const rightOrder = order.get(right) ?? Number.POSITIVE_INFINITY;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.localeCompare(right);
}
