import GithubSlugger from "github-slugger";
import type { ReactNode } from "react";
import { specs, type Spec } from "../data/specs";

export type HeadingInfo = {
  id: string;
  level: number;
  text: string;
};

export function extractHeadings(markdown: string): HeadingInfo[] {
  const slugger = new GithubSlugger();
  const headings: HeadingInfo[] = [];
  const pattern = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = pattern.exec(markdown))) {
    const text = stripMarkdownInline(match[2].trim());
    headings.push({
      id: slugger.slug(text),
      level: match[1].length,
      text,
    });
  }

  return headings;
}

export function resolveMarkdownHref(href: string | undefined, currentSpec: Spec) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("/")) {
    return href;
  }

  const [pathPart, hashPart] = href.split("#", 2);
  const hash = hashPart ? `#${new GithubSlugger().slug(decodeURIComponent(hashPart))}` : "";

  if (!pathPart.endsWith(".md")) {
    return href;
  }

  const currentDirectory = currentSpec.path.split("/").slice(0, -1);
  const targetParts = [...currentDirectory, ...pathPart.split("/")];
  const normalizedParts: string[] = [];

  for (const part of targetParts) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      normalizedParts.pop();
      continue;
    }

    normalizedParts.push(part);
  }

  const targetPath = normalizedParts.join("/");
  const targetSpec = specs.find((item) => item.path === targetPath);

  return targetSpec ? `${targetSpec.route}${hash}` : href;
}

export function textFromReactNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(textFromReactNode).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    const props = node.props as { children?: ReactNode };
    return textFromReactNode(props.children);
  }

  return "";
}

function stripMarkdownInline(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, "$1");
}
