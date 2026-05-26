export function formatLanguage(language: string) {
  const labels: Record<string, string> = {
    csharp: "C#",
    ebnf: "EBNF",
    go: "Go",
    json: "JSON",
    mst: "Masterbelt",
    sql: "SQL",
    ts: "TypeScript",
    yaml: "YAML",
  };

  return labels[language] ?? language.toUpperCase();
}

export function highlightCode(code: string, language: string) {
  if (language === "json") {
    return highlightJson(code);
  }

  if (language === "sql") {
    return highlightSql(code);
  }

  const escaped = escapeHtml(code);

  if (language === "ebnf") {
    return escaped
      .replace(/^([A-Za-z_][\w-]*)(\s*=)/gm, '<span class="token-name">$1</span>$2')
      .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="token-string">$1</span>')
      .replace(/\b([A-Z][A-Z_]+)\b/g, '<span class="token-constant">$1</span>');
  }

  if (language === "mst") {
    return escaped
      .replace(/(^|\s)(master|field|relation|validation|assert|scope|static|filter)\b/g, '$1<span class="token-keyword">$2</span>')
      .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="token-string">$1</span>')
      .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="token-type">$1</span>');
  }

  return escaped
    .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="token-string">$1</span>')
    .replace(/\b(const|let|var|func|function|return|type|interface|class|public|private|namespace|using|package|import|struct|if|else|for|switch|case|new)\b/g, '<span class="token-keyword">$1</span>');
}

function highlightSql(code: string) {
  return escapeHtml(code).replace(
    /(--.*$)|(&quot;(?:\\.|[^\\])*?&quot;|&#39;(?:\\.|[^\\])*?&#39;)|\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|UNIQUE|INDEX|AS|AND|OR|IN|IS|CASE|WHEN|THEN|ELSE|END|LIMIT|OFFSET|ASC|DESC)\b|\b(COUNT|SUM|AVG|MIN|MAX|COALESCE|LOWER|UPPER|CAST)\s*(?=\()|-?\b\d+(?:\.\d+)?\b/gim,
    (match, comment: string | undefined, stringToken: string | undefined, keyword: string | undefined, fn: string | undefined) => {
      if (comment) return `<span class="token-comment">${comment}</span>`;
      if (stringToken) return `<span class="token-string">${stringToken}</span>`;
      if (keyword) return `<span class="token-keyword">${keyword}</span>`;
      if (fn) return `<span class="token-function">${fn}</span>`;
      return `<span class="token-number">${match}</span>`;
    },
  );
}

function highlightJson(code: string) {
  return escapeHtml(code).replace(
    /(&quot;(?:\\.|[^\\])*?&quot;)(\s*:)?|\b(true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
    (match, stringToken: string | undefined, colon: string | undefined, literal: string | undefined) => {
      if (stringToken) {
        const className = colon ? "token-property" : "token-string";
        return `<span class="${className}">${stringToken}</span>${colon ?? ""}`;
      }

      if (literal) return `<span class="token-constant">${literal}</span>`;
      return `<span class="token-number">${match}</span>`;
    },
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
