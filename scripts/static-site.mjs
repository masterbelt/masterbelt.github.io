export function buildSpecMetadata({ siteUrl, spec, markdown }) {
  return {
    title: `${spec.title} | Masterbelt`,
    description: descriptionFromMarkdown(markdown) ?? `${spec.title} in the Masterbelt specification.`,
    canonical: new URL(spec.route, siteUrl).toString(),
  };
}

export function withRenderedApp(html, appHtml) {
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
}

export function withPageMetadata(html, metadata) {
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeAttribute(metadata.description)}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${escapeAttribute(metadata.canonical)}" />`,
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
