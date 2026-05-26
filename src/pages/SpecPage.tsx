import { useEffect, useRef, useState } from "react";
import { source, specNavRows, type Spec } from "../data/specs";
import { extractHeadings } from "../lib/markdown";
import { MarkdownRenderer } from "../components/MarkdownRenderer";

export function SpecPage({ spec, markdown }: { spec: Spec; markdown: string }) {
  const headings = extractHeadings(markdown);
  const currentNavItemRef = useRef<HTMLAnchorElement | null>(null);
  const headingsNavRef = useRef<HTMLElement | null>(null);
  const activeHeadingIdRef = useRef(headings[0]?.id ?? "");
  const [activeHeadingId, setActiveHeadingId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    currentNavItemRef.current?.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
  }, [spec.path]);

  useEffect(() => {
    const initialHeadingId = headings[0]?.id ?? "";
    activeHeadingIdRef.current = initialHeadingId;
    setActiveHeadingId(initialHeadingId);

    const updateActiveHeading = () => {
      const headingElements = headings
        .map((heading) => document.getElementById(heading.id))
        .filter((element): element is HTMLElement => Boolean(element));
      let activeId = headingElements[0]?.id ?? "";

      for (const element of headingElements) {
        if (element.getBoundingClientRect().top <= 120) {
          activeId = element.id;
        } else {
          break;
        }
      }

      if (activeHeadingIdRef.current !== activeId) {
        activeHeadingIdRef.current = activeId;
        setActiveHeadingId(activeId);
      }
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [spec.path, markdown]);

  useEffect(() => {
    const nav = headingsNavRef.current;
    if (!nav) return;

    const activeLink = nav.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(activeHeadingId)}"]`);
    if (!activeLink) return;

    const targetTop = activeLink.offsetTop - nav.clientHeight / 2 + activeLink.clientHeight / 2;
    nav.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }, [activeHeadingId]);

  return (
    <section className="border-t border-zinc-200">
      <div className="mx-auto grid w-[min(1280px,calc(100%-32px))] grid-cols-1 gap-10 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="overflow-hidden border-l border-zinc-300 bg-white lg:sticky lg:top-4 lg:self-start">
          <section className="border-b border-zinc-200">
            <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600">On this page</div>
            <nav
              ref={headingsNavRef}
              className="grid max-h-[30vh] gap-1 overflow-auto px-2 pb-3 text-sm"
              aria-label="Current page headings"
            >
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  className={`rounded-md py-1.5 pr-3 no-underline ${
                    activeHeadingId === heading.id
                      ? "bg-teal-900 font-bold text-white"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                  href={`#${heading.id}`}
                  onClick={() => setActiveHeadingId(heading.id)}
                  style={{ paddingLeft: `${12 + Math.max(0, heading.level - 2) * 12}px` }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </section>

          <section>
            <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600">Specification</div>
            <nav className="grid max-h-[calc(70vh-156px)] gap-1 overflow-auto px-2 pb-3 text-sm" aria-label="Spec pages">
              {specNavRows.map((row) =>
                row.type === "section" ? (
                  <div
                    key={row.key}
                    className="mt-3 text-xs font-black uppercase tracking-wide text-zinc-500 first:mt-0"
                    style={{ paddingLeft: `${12 + row.depth * 12}px` }}
                  >
                    {row.label}
                  </div>
                ) : (
                  <a
                    key={row.key}
                    ref={row.spec.path === spec.path ? currentNavItemRef : undefined}
                    className={`rounded-md py-2 pr-3 no-underline ${
                      row.spec.path === spec.path
                        ? "bg-teal-900 font-bold text-white"
                        : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    }`}
                    href={row.spec.route}
                    style={{ paddingLeft: `${12 + row.depth * 12}px` }}
                  >
                    {row.spec.title}
                  </a>
                ),
              )}
            </nav>
          </section>
        </aside>

        <article className="min-w-0">
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
            <p className="mb-2 text-xs font-bold uppercase text-teal-700">masterbelt/masterbelt</p>
            <h1 className="m-0 text-5xl font-black leading-tight">{spec.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
              <span>Synced from main@{source.shortCommit || "local"}</span>
              <a className="text-teal-900" href={spec.markdownUrl}>Markdown</a>
              <a className="text-teal-900" href={spec.sourceUrl}>Source</a>
            </div>
          </div>

          <MarkdownRenderer spec={spec} markdown={markdown} />
        </article>
      </div>
    </section>
  );
}
