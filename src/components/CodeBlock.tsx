import { useEffect, useId, useState, type PointerEvent, type ReactNode } from "react";
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
        <code dangerouslySetInnerHTML={{ __html: highlightedHtml ?? highlightCode(code, language) }} />
      </pre>
    </figure>
  );
}

function MermaidDiagram({ code }: { code: string }) {
  const id = useId().replaceAll(":", "");
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.5);
  const [drag, setDrag] = useState<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);

  useEffect(() => {
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
  }, [code, id]);

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
    <figure className="mermaid-block">
      <figcaption>
        <span>Mermaid</span>
        <span className="mermaid-controls">
          <button type="button" onClick={() => setScale((value) => Math.max(0.75, value - 0.25))}>-</button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((value) => Math.min(2.5, value + 0.25))}>+</button>
          <button type="button" onClick={() => setScale(1)}>Reset</button>
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
          dangerouslySetInnerHTML={{ __html: svg }}
        />
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
