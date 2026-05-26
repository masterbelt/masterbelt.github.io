import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSpecMetadata,
  descriptionFromMarkdown,
  withPageMetadata,
  withRenderedApp,
} from "../scripts/static-site.mjs";

const shellHtml = `<!doctype html>
<html>
  <head>
    <meta name="description" content="Default description" />
    <link rel="canonical" href="https://masterbelt.dev/" />
    <title>Masterbelt</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

test("withRenderedApp injects prerendered HTML into the root", () => {
  const rendered = withRenderedApp(shellHtml, "<main><h1>Syntax Structure</h1></main>");

  assert.match(rendered, /<div id="root"><main><h1>Syntax Structure<\/h1><\/main><\/div>/);
  assert.doesNotMatch(rendered, /<div id="root"><\/div>/);
});

test("withPageMetadata writes page-specific title, description, and canonical", () => {
  const html = withPageMetadata(shellHtml, {
    title: "Syntax Structure | Masterbelt",
    description: 'Syntax "reference" & examples',
    canonical: "https://masterbelt.dev/spec/language/syntax/",
    alternates: [
      {
        href: "https://masterbelt.dev/spec-src/language/syntax.md",
        title: "Syntax Structure Markdown",
        type: "text/markdown",
      },
    ],
  });

  assert.match(html, /<title>Syntax Structure \| Masterbelt<\/title>/);
  assert.match(html, /<meta name="description" content="Syntax &quot;reference&quot; &amp; examples" \/>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/masterbelt.dev\/spec\/language\/syntax\/" \/>/);
  assert.match(
    html,
    /<link rel="alternate" type="text\/markdown" href="https:\/\/masterbelt.dev\/spec-src\/language\/syntax.md" title="Syntax Structure Markdown" \/>/,
  );
});

test("descriptionFromMarkdown uses the first prose paragraph", () => {
  const description = descriptionFromMarkdown(`# Syntax Structure

\`\`\`mst
type User = { id: Int }
\`\`\`

| Column | Description |
| --- | --- |

This document describes the \`currently implemented\` [Masterbelt syntax](./syntax.md).
`);

  assert.equal(description, "This document describes the currently implemented Masterbelt syntax.");
});

test("buildSpecMetadata derives stable per-spec metadata", () => {
  const metadata = buildSpecMetadata({
    siteUrl: "https://masterbelt.dev",
    spec: {
      title: "Go Code Generation",
      route: "/spec/codegen/golang/",
      markdownUrl: "/spec-src/codegen/golang.md",
    },
    markdown: "# Go Code Generation\n\nThis document defines the Go code generation target.",
  });

  assert.deepEqual(metadata, {
    title: "Go Code Generation | Masterbelt",
    description: "This document defines the Go code generation target.",
    canonical: "https://masterbelt.dev/spec/codegen/golang/",
    alternates: [
      {
        href: "https://masterbelt.dev/spec-src/codegen/golang.md",
        title: "Go Code Generation Markdown",
        type: "text/markdown",
      },
    ],
  });
});
