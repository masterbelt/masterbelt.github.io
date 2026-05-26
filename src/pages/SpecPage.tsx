import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { LuFileText } from "react-icons/lu";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { type Spec, source, specNavRows } from "../data/specs";
import { extractHeadings } from "../lib/markdown";

export function SpecPage({ spec, markdown }: { spec: Spec; markdown: string }) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const desktopCurrentNavItemRef = useRef<HTMLAnchorElement | null>(null);
  const mobileCurrentNavItemRef = useRef<HTMLAnchorElement | null>(null);
  const headingsNavRef = useRef<HTMLElement | null>(null);
  const activeHeadingIdRef = useRef(headings[0]?.id ?? "");
  const [activeHeadingId, setActiveHeadingId] = useState(headings[0]?.id ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: this effect intentionally runs when the selected spec changes
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    desktopCurrentNavItemRef.current?.scrollIntoView({
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
  }, [headings]);

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

          <section className="hidden lg:block">
            <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600">Specification</div>
            <SpecNavigation
              ariaLabel="Spec pages"
              currentNavItemRef={desktopCurrentNavItemRef}
              currentSpecPath={spec.path}
              maxHeightClassName="max-h-[calc(70vh-156px)]"
            />
          </section>
        </aside>

        <article className="min-w-0">
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
            <p className="mb-2 text-xs font-bold uppercase text-teal-700">masterbelt/masterbelt</p>
            <h1 className="m-0 text-5xl font-black leading-tight">{spec.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-600">
              <span>Synced from main@{source.shortCommit || "local"}</span>
              <a className="inline-flex items-center gap-1.5 text-teal-900" href={spec.markdownUrl}>
                <LuFileText aria-hidden="true" size={15} />
                Markdown
              </a>
              <a className="inline-flex items-center gap-1.5 text-teal-900" href={spec.sourceUrl}>
                <FaGithub aria-hidden="true" size={15} />
                Source
              </a>
            </div>
          </div>

          <MarkdownRenderer spec={spec} markdown={markdown} />
        </article>

        <section className="overflow-hidden border-l border-zinc-300 bg-white lg:hidden">
          <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600">Specification</div>
          <SpecNavigation
            ariaLabel="Other spec pages"
            currentNavItemRef={mobileCurrentNavItemRef}
            currentSpecPath={spec.path}
            maxHeightClassName="max-h-[52vh]"
          />
        </section>
      </div>
    </section>
  );
}

function SpecNavigation({
  ariaLabel,
  currentNavItemRef,
  currentSpecPath,
  maxHeightClassName,
}: {
  ariaLabel: string;
  currentNavItemRef: RefObject<HTMLAnchorElement | null>;
  currentSpecPath: string;
  maxHeightClassName: string;
}) {
  return (
    <nav className={`grid gap-1 overflow-auto px-2 pb-3 text-sm ${maxHeightClassName}`} aria-label={ariaLabel}>
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
            ref={row.spec.path === currentSpecPath ? currentNavItemRef : undefined}
            className={`rounded-md py-2 pr-3 no-underline ${
              row.spec.path === currentSpecPath
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
  );
}
