import { type PointerEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { LuRotateCcw, LuZoomIn, LuZoomOut } from "react-icons/lu";
import { formatLanguage, highlightCode } from "../lib/syntaxHighlight";

export function CodeBlock({
  children,
  className,
  highlightedHtml,
}: {
  children?: ReactNode;
  className?: string;
  highlightedHtml?: string | null;
}) {
  const language = className?.match(/language-(\w+)/)?.[1] ?? "";
  const code = String(children ?? "").replace(/\n$/, "");

  if (!language) {
    return <code>{children}</code>;
  }

  if (language === "mermaid") {
    return <MermaidDiagram code={code} />;
  }

  return (
    <figure className="code-block">
      <figcaption>{formatLanguage(language)}</figcaption>
      <pre data-language={language}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: code highlighter returns escaped HTML with token spans */}
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml ?? highlightCode(code, language) }} />
      </pre>
    </figure>
  );
}

function MermaidDiagram({ code }: { code: string }) {
  const id = useId().replaceAll(":", "");
  const figureRef = useRef<HTMLElement | null>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.5);
  const [shouldRender, setShouldRender] = useState(false);
  const [drag, setDrag] = useState<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(figure);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    let cancelled = false;

    import("mermaid")
      .then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            primaryColor: "#f0fdfa",
            primaryBorderColor: "#0f766e",
            primaryTextColor: "#18181b",
            lineColor: "#52525b",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          },
        });

        return mermaid.render(`mermaid-${id}`, code);
      })
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setSvg("");
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, id, shouldRender]);

  if (error) {
    return (
      <figure className="code-block">
        <figcaption>Mermaid</figcaption>
        <pre data-language="mermaid">
          <code>{code}</code>
        </pre>
      </figure>
    );
  }

  return (
    <figure ref={figureRef} className="mermaid-block">
      <figcaption>
        <span>Mermaid</span>
        <span className="mermaid-controls">
          <button
            type="button"
            onClick={() => setScale((value) => Math.max(0.75, value - 0.25))}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <LuZoomOut aria-hidden="true" size={14} />
          </button>
          <span className="mermaid-scale">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((value) => Math.min(2.5, value + 0.25))}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <LuZoomIn aria-hidden="true" size={14} />
          </button>
          <button type="button" onClick={() => setScale(1)} aria-label="Reset zoom" title="Reset zoom">
            <LuRotateCcw aria-hidden="true" size={14} />
          </button>
        </span>
      </figcaption>
      <div
        className={`mermaid-scroll ${drag ? "is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="mermaid-canvas"
          style={{ "--mermaid-scale": String(scale) } as React.CSSProperties}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders SVG markup from a strict-security parser
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {!svg && !error ? <div className="mermaid-placeholder">Loading diagram...</div> : null}
      </div>
    </figure>
  );

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    setDrag({
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: target.scrollLeft,
      top: target.scrollTop,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const target = event.currentTarget;
    target.scrollLeft = drag.left - (event.clientX - drag.x);
    target.scrollTop = drag.top - (event.clientY - drag.y);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drag?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDrag(null);
    }
  }
}
