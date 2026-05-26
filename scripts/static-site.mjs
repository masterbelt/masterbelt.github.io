export function buildSpecMetadata({ siteUrl, spec, markdown }) {
  return {
    title: `${spec.title} | Masterbelt`,
    description: descriptionFromMarkdown(markdown) ?? `${spec.title} in the Masterbelt specification.`,
    canonical: new URL(spec.route, siteUrl).toString(),
    alternates: [
      {
        href: new URL(spec.markdownUrl, siteUrl).toString(),
        title: `${spec.title} Markdown`,
        type: "text/markdown",
      },
    ],
  };
}

export function withRenderedApp(html, appHtml) {
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

export function withPageMetadata(html, metadata) {
  const canonicalLink = `<link rel="canonical" href="${escapeAttribute(metadata.canonical)}" />`;
  const alternateLinks = (metadata.alternates ?? [])
    .map(
      (alternate) =>
        `<link rel="alternate" type="${escapeAttribute(alternate.type)}" href="${escapeAttribute(alternate.href)}" title="${escapeAttribute(alternate.title)}" />`,
    )
    .join("\n    ");

  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeAttribute(metadata.description)}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      alternateLinks ? `${canonicalLink}\n    ${alternateLinks}` : canonicalLink,
    );
}

export function descriptionFromMarkdown(markdown) {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  const paragraphs = withoutCode
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !paragraph.startsWith("#") && !paragraph.startsWith("|"));
  const paragraph = paragraphs[0];

  if (!paragraph) {
    return undefined;
  }

  return stripMarkdown(paragraph).replace(/\s+/g, " ").slice(0, 180);
}

function stripMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~>#-]/g, "")
    .trim();
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
