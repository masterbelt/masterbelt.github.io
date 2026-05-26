import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaGithub, FaMagnifyingGlass } from "react-icons/fa6";
import { LuFileText } from "react-icons/lu";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import { type Spec, searchSpecs, source, specNavRows, specs } from "../data/specs";
import { extractHeadings } from "../lib/markdown";

export function SpecPage({ spec, markdown }: { spec: Spec; markdown: string }) {
  const headings = useMemo(() => extractHeadings(markdown).filter((heading) => heading.level > 1), [markdown]);
  const hasHeadings = headings.length > 0;
  const sectionNavigation = useMemo(() => getSectionNavigation(spec), [spec]);
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
        <aside
          className="grid gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:grid-rows-[auto_auto_minmax(0,1fr)] lg:self-start"
          aria-label="Specification navigation"
        >
          <SpecSearch currentSpecPath={spec.path} />

          {hasHeadings ? (
            <section
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
              aria-labelledby="page-outline-title"
            >
              <div
                id="page-outline-title"
                className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600"
              >
                On this page
              </div>
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

          <section
            className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white lg:flex lg:min-h-0 lg:flex-col"
            aria-labelledby="desktop-spec-nav-title"
          >
            <div
              id="desktop-spec-nav-title"
              className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600"
            >
              Specification
            </div>
            <SpecNavigation
              ariaLabel="Spec pages"
              currentNavItemRef={desktopCurrentNavItemRef}
              currentSpecPath={spec.path}
              maxHeightClassName="min-h-0 flex-1"
              navRef={desktopSpecNavRef}
            />
          </section>
        </aside>

        <article className="min-w-0" aria-labelledby="spec-title">
          <div className="rounded-lg border border-zinc-200 bg-white px-8 py-9">
            <SpecBreadcrumb spec={spec} />
            <h1 id="spec-title" className="m-0 text-5xl font-black leading-tight">
              {spec.title}
            </h1>
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

            <div className="mt-8 border-t border-zinc-200 pt-2">
              <MarkdownRenderer spec={spec} markdown={markdown} />
            </div>
          </div>
          <SpecPager next={siblingNavigation.next} previous={siblingNavigation.previous} />
          <SectionBackLink sectionNavigation={sectionNavigation} />
        </article>

        <section
          className="overflow-hidden rounded-lg border border-zinc-200 bg-white lg:hidden"
          aria-labelledby="mobile-spec-nav-title"
        >
          <div
            id="mobile-spec-nav-title"
            className="px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600"
          >
            Specification
          </div>
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

function SpecSearch({ currentSpecPath }: { currentSpecPath: string }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSpecs(query), [query]);
  const hasQuery = query.trim().length >= 2;
  const resultsId = "spec-search-results";

  return (
    <section
      className="relative overflow-visible rounded-lg border border-zinc-200 bg-white"
      aria-labelledby="spec-search-label"
    >
      <label className="block px-4 py-3 text-xs font-black uppercase tracking-wide text-zinc-600" htmlFor="spec-search">
        <span id="spec-search-label">Search</span>
      </label>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus-within:border-teal-700">
          <FaMagnifyingGlass className="shrink-0 text-zinc-400" aria-hidden="true" size={13} />
          <input
            id="spec-search"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-zinc-400"
            type="search"
            role="combobox"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Find specs"
            aria-autocomplete="list"
            aria-controls={hasQuery ? resultsId : undefined}
            aria-expanded={hasQuery}
            aria-haspopup="listbox"
          />
        </div>
      </div>
      {hasQuery ? (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-20 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div id={resultsId} className="grid max-h-80 gap-1 overflow-auto p-2 text-sm" role="listbox">
            {results.length > 0 ? (
              results.map((result) => (
                <a
                  key={result.spec.path}
                  role="option"
                  aria-selected={result.spec.path === currentSpecPath}
                  className={`rounded-md px-3 py-2 no-underline ${
                    result.spec.path === currentSpecPath
                      ? "bg-teal-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                  href={result.spec.route}
                  onClick={() => setQuery("")}
                >
                  <span className="block font-bold">{result.spec.title}</span>
                  {result.excerpt ? <span className="mt-1 block text-xs opacity-75">{result.excerpt}</span> : null}
                </a>
              ))
            ) : (
              <p className="m-0 px-3 py-2 text-sm text-zinc-500">No matching specs.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getSectionNavigation(currentSpec: Spec) {
  const section = currentSpec.segments[0];
  if (!section || currentSpec.segments.length < 2) return undefined;

  const firstSpec = specs.find((item) => item.segments[0] === section);
  if (!firstSpec) return undefined;

  return {
    label: formatSegmentLabel(section),
    route: firstSpec.route,
  };
}

function SectionBackLink({ sectionNavigation }: { sectionNavigation?: { label: string; route: string } }) {
  if (!sectionNavigation) return null;

  return (
    <a
      className="mt-6 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-teal-900 no-underline hover:border-teal-700 hover:text-teal-950"
      href={sectionNavigation.route}
    >
      <FaArrowLeft aria-hidden="true" size={14} />
      Back to {sectionNavigation.label}
    </a>
  );
}

function SpecBreadcrumb({ spec }: { spec: Spec }) {
  const sectionLabel = spec.segments.length > 1 ? formatSegmentLabel(spec.segments[0]) : undefined;

  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-bold text-zinc-500" aria-label="Breadcrumb">
      <a className="text-teal-800 no-underline hover:text-teal-950" href="/spec/">
        Specification
      </a>
      {sectionLabel ? (
        <>
          <span aria-hidden="true">/</span>
          <span>{sectionLabel}</span>
        </>
      ) : null}
    </nav>
  );
}

function formatSegmentLabel(segment: string) {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
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
          <a
            key={row.key}
            className="mt-3 rounded-md py-1 text-xs font-black uppercase tracking-wide text-zinc-500 no-underline first:mt-0 hover:bg-zinc-100 hover:text-zinc-950"
            href={row.route}
            style={{ paddingLeft: `${12 + row.depth * 12}px` }}
          >
            {row.label}
          </a>
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
