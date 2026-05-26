import GithubSlugger from "github-slugger";
import { type MouseEvent, memo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { codeHighlights, type Spec } from "../data/specs";
import { resolveMarkdownHref, textFromReactNode } from "../lib/markdown";
import { CodeBlock } from "./CodeBlock";

export const MarkdownRenderer = memo(function MarkdownRenderer({ spec, markdown }: { spec: Spec; markdown: string }) {
  const headingSlugger = new GithubSlugger();
  const CodeBlockForSpec = createCodeBlockComponent(spec);

  return (
    <div className="prose prose-zinc w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <MarkdownLink href={href} currentSpec={spec}>
              {children}
            </MarkdownLink>
          ),
          code: CodeBlockForSpec,
          h1: () => null,
          h2: ({ children }) => (
            <Heading level={2} slugger={headingSlugger}>
              {children}
            </Heading>
          ),
          h3: ({ children }) => (
            <Heading level={3} slugger={headingSlugger}>
              {children}
            </Heading>
          ),
          h4: ({ children }) => (
            <Heading level={4} slugger={headingSlugger}>
              {children}
            </Heading>
          ),
          h5: ({ children }) => (
            <Heading level={5} slugger={headingSlugger}>
              {children}
            </Heading>
          ),
          h6: ({ children }) => (
            <Heading level={6} slugger={headingSlugger}>
              {children}
            </Heading>
          ),
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
});

function createCodeBlockComponent(spec: Spec) {
  let masterbeltBlockIndex = 0;

  return function CodeBlockForSpec({ children, className }: { children?: ReactNode; className?: string }) {
    const language = className?.match(/language-(\w+)/)?.[1] ?? "";
    const highlightedHtml = language === "mst" ? codeHighlights[spec.path]?.[masterbeltBlockIndex++] : undefined;

    return (
      <CodeBlock className={className} highlightedHtml={highlightedHtml}>
        {children}
      </CodeBlock>
    );
  };
}

function Heading({
  level,
  slugger,
  children,
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  slugger: GithubSlugger;
  children?: ReactNode;
}) {
  const text = textFromReactNode(children);
  const id = slugger.slug(text);
  const Tag = `h${level}` as const;

  return (
    <Tag id={id}>
      <a
        className="heading-anchor"
        href={`#${id}`}
        onClick={(event) => copyHeadingLink(event, id)}
        aria-label={`Copy link to ${text}`}
        title="Copy heading link"
      >
        #
      </a>
      {children}
    </Tag>
  );
}

function copyHeadingLink(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();

  const url = new URL(window.location.href);
  url.hash = id;
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  document.getElementById(id)?.scrollIntoView({ block: "start" });

  void navigator.clipboard?.writeText(url.href).catch(() => undefined);
}

function MarkdownLink({ href, currentSpec, children }: { href?: string; currentSpec: Spec; children?: ReactNode }) {
  return <a href={resolveMarkdownHref(href, currentSpec)}>{children}</a>;
}
