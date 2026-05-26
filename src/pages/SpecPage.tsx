import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaGithub } from "react-icons/fa6";
import { LuFileText } from "react-icons/lu";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { type Spec, source, specNavRows, specs } from "../data/specs";
import { extractHeadings } from "../lib/markdown";

export function SpecPage({ spec, markdown }: { spec: Spec; markdown: string }) {
  const headings = useMemo(() => extractHeadings(markdown).filter((heading) => heading.level > 1), [markdown]);
  const hasHeadings = headings.length > 0;
  const siblingNavigation = useMemo(() => getSiblingNavigation(spec), [spec]);
  const desktopSpecNavRef = useRef<HTMLElement | null>(null);
  const desktopCurrentNavItemRef = useRef<HTMLAnchorElement | null>(null);
  const mobileSpecNavRef = useRef<HTMLElement | null>(null);
  const mobileCurrentNavItemRef = useRef<HTMLAnchorElement | null>(null);
  const headingsNavRef = useRef<HTMLElement | null>(null);
  const activeHeadingIdRef = useRef(headings[0]?.id ?? "");
  const [activeHeadingId, setActiveHeadingId] = useState(headings[0]?.id ?? "");

  // biome-ignore lint/correctness/useExhaustiveDependencies: this effect intentionally runs when the selected spec changes
  useEffect(() => {
    scrollNavItemToCenter(desktopSpecNavRef.current, desktopCurrentNavItemRef.current);
    scrollNavItemToCenter(mobileSpecNavRef.current, mobileCurrentNavItemRef.current);
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
        <aside className={`${hasHeadings ? "grid" : "hidden lg:grid"} gap-4 lg:sticky lg:top-4 lg:self-start`}>
          {hasHeadings ? (
            <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
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
          ) : null}

          <section className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white lg:block">
            <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600">Specification</div>
            <SpecNavigation
              ariaLabel="Spec pages"
              currentNavItemRef={desktopCurrentNavItemRef}
              currentSpecPath={spec.path}
              maxHeightClassName="max-h-[calc(70vh-156px)]"
              navRef={desktopSpecNavRef}
            />
          </section>
        </aside>

        <article className="min-w-0">
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-5">
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
          <SpecPager next={siblingNavigation.next} previous={siblingNavigation.previous} />
        </article>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white lg:hidden">
          <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600">Specification</div>
          <SpecNavigation
            ariaLabel="Other spec pages"
            currentNavItemRef={mobileCurrentNavItemRef}
            currentSpecPath={spec.path}
            maxHeightClassName="max-h-[52vh]"
            navRef={mobileSpecNavRef}
          />
        </section>
      </div>
    </section>
  );
}

function getSiblingNavigation(currentSpec: Spec) {
  const currentDirectory = currentSpec.path.split("/").slice(0, -1).join("/");
  const siblings = specs.filter((item) => item.path.split("/").slice(0, -1).join("/") === currentDirectory);
  const index = siblings.findIndex((item) => item.path === currentSpec.path);

  return {
    previous: index > 0 ? siblings[index - 1] : undefined,
    next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined,
  };
}

function SpecPager({ next, previous }: { next?: Spec; previous?: Spec }) {
  if (!previous && !next) return null;

  return (
    <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Sibling specifications">
      {previous ? (
        <SpecPagerLink direction="previous" spec={previous} />
      ) : (
        <div className="hidden sm:block" aria-hidden="true" />
      )}
      {next ? <SpecPagerLink direction="next" spec={next} /> : null}
    </nav>
  );
}

function SpecPagerLink({ direction, spec }: { direction: "next" | "previous"; spec: Spec }) {
  const isPrevious = direction === "previous";

  return (
    <a
      className={`group flex min-h-24 items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-zinc-700 no-underline hover:border-teal-700 hover:text-zinc-950 ${
        isPrevious ? "justify-start" : "justify-end text-right"
      }`}
      href={spec.route}
    >
      {isPrevious ? <FaArrowLeft className="shrink-0 text-teal-800" aria-hidden="true" /> : null}
      <span>
        <span className="block text-xs font-black uppercase tracking-wide text-zinc-500">
          {isPrevious ? "Previous" : "Next"}
        </span>
        <span className="mt-1 block font-bold text-zinc-950 group-hover:text-teal-900">{spec.title}</span>
      </span>
      {!isPrevious ? <FaArrowRight className="shrink-0 text-teal-800" aria-hidden="true" /> : null}
    </a>
  );
}

function scrollNavItemToCenter(nav: HTMLElement | null, navItem: HTMLElement | null) {
  if (!nav || !navItem || nav.offsetParent === null || navItem.offsetParent === null) return;

  const navRect = nav.getBoundingClientRect();
  const navItemRect = navItem.getBoundingClientRect();
  const targetTop = nav.scrollTop + navItemRect.top - navRect.top - nav.clientHeight / 2 + navItem.clientHeight / 2;
  const maxTop = Math.max(0, nav.scrollHeight - nav.clientHeight);

  nav.scrollTo({
    top: Math.min(maxTop, Math.max(0, targetTop)),
    behavior: "auto",
  });
}

function SpecNavigation({
  ariaLabel,
  currentNavItemRef,
  currentSpecPath,
  maxHeightClassName,
  navRef,
}: {
  ariaLabel: string;
  currentNavItemRef?: RefObject<HTMLAnchorElement | null>;
  currentSpecPath: string;
  maxHeightClassName: string;
  navRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <nav
      ref={navRef}
      className={`grid gap-1 overflow-auto px-2 pb-3 text-sm ${maxHeightClassName}`}
      aria-label={ariaLabel}
    >
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
