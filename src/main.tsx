import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const app = (
  <StrictMode>
    <ClientApp />
  </StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

function ClientApp() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const pendingScrollRef = useRef<URL | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const navigate = (url: URL) => {
      pendingScrollRef.current = url;
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      setPathname(url.pathname);
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !isClientRoute(url.pathname)) return;

      const isSameDocument = url.pathname === window.location.pathname && url.search === window.location.search;
      if (isSameDocument) return;

      event.preventDefault();
      link.blur();
      navigate(url);
    };

    const handlePopState = () => {
      const url = new URL(window.location.href);
      pendingScrollRef.current = url;
      setPathname(url.pathname);
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pendingScrollRef is set immediately before pathname changes
  useLayoutEffect(() => {
    const url = pendingScrollRef.current;
    if (!url) return;

    pendingScrollRef.current = null;

    if (url.hash) {
      document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
      return;
    }

    window.scrollTo({ left: 0, top: 0 });
  }, [pathname]);

  return <App pathname={pathname} />;
}

function isClientRoute(pathname: string) {
  if (pathname === "/" || pathname === "/spec" || pathname === "/spec/") {
    return true;
  }

  return pathname.startsWith("/spec/") && !pathname.startsWith("/spec-src/");
}
