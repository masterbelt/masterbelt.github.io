const docs = [
  {
    title: "Generated docs",
    body: "API references and package documentation can be emitted into the static build without changing the hosting model.",
  },
  {
    title: "Project notes",
    body: "Architecture notes, release notes, and examples have a stable home under masterbelt.dev.",
  },
  {
    title: "Pages deploy",
    body: "GitHub Actions builds the app and publishes only the generated dist artifact.",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <header className="mx-auto flex min-h-18 w-[min(1120px,calc(100%-32px))] items-center justify-between gap-6">
        <a className="flex items-center gap-3 font-bold no-underline" href="/" aria-label="Masterbelt home">
          <img src="/masterbelt-mark.svg" width="32" height="32" alt="" />
          <span>Masterbelt</span>
        </a>
        <nav className="flex items-center gap-5 text-sm text-zinc-600" aria-label="Primary">
          <a className="hover:text-zinc-950" href="#docs">
            Docs
          </a>
          <a className="hover:text-zinc-950" href="https://github.com/masterbelt">
            GitHub
          </a>
        </nav>
      </header>

      <main>
        <section className="border-y border-zinc-200 bg-[radial-gradient(circle_at_78%_18%,rgba(192,138,31,0.18),transparent_28%),linear-gradient(135deg,#ffffff_0%,#f0f6f4_52%,#f7f7f4_100%)]">
          <div className="mx-auto grid min-h-[520px] w-[min(1120px,calc(100%-32px))] grid-cols-1 items-center gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
            <div>
              <p className="mb-4 text-xs font-bold uppercase text-teal-700">masterbelt.dev</p>
              <h1 className="max-w-3xl text-5xl font-black leading-none sm:text-7xl md:text-8xl">
                Masterbelt
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
                Documentation, release notes, and implementation notes for the Masterbelt project.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  className="inline-flex min-h-11 items-center rounded-md border border-teal-900 bg-teal-900 px-5 font-bold text-white no-underline"
                  href="#docs"
                >
                  Docs
                </a>
                <a
                  className="inline-flex min-h-11 items-center rounded-md border border-teal-900 px-5 font-bold text-teal-900 no-underline"
                  href="https://github.com/masterbelt"
                >
                  GitHub
                </a>
              </div>
            </div>

            <aside className="grid gap-3 rounded-lg border border-zinc-200 bg-white/75 p-6" aria-label="Site status">
              <StatusRow label="Domain" value="masterbelt.dev" />
              <StatusRow label="Build" value="Vite + React" />
              <StatusRow label="Output" value="Static HTML assets" />
            </aside>
          </div>
        </section>

        <section id="docs" className="mx-auto w-[min(1120px,calc(100%-32px))] py-14">
          <h2 className="mb-6 text-2xl font-bold leading-tight">Ready for generated documentation</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {docs.map((item) => (
              <article key={item.title} className="min-h-44 rounded-lg border border-zinc-200 bg-white p-5">
                <h3 className="mb-3 font-bold">{item.title}</h3>
                <p className="m-0 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-[min(1120px,calc(100%-32px))] justify-between gap-4 border-t border-zinc-200 py-7 text-sm text-zinc-600">
        <span>&copy; {new Date().getFullYear()} Masterbelt</span>
        <a className="hover:text-zinc-950" href="https://github.com/masterbelt">
          GitHub
        </a>
      </footer>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-zinc-200 py-3 last:border-b-0 sm:grid-cols-[96px_1fr] sm:gap-4">
      <span className="text-xs font-bold uppercase text-zinc-500">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default App;
