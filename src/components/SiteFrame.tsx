import type { ReactNode } from "react";

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-zinc-950">
      <header className="mx-auto flex min-h-18 w-[min(1120px,calc(100%-32px))] items-center justify-between gap-6">
        <a className="flex items-center gap-3 font-bold no-underline" href="/" aria-label="Masterbelt home">
          <img src="/masterbelt-mark.svg" width="32" height="32" alt="" />
          <span>Masterbelt</span>
        </a>
        <nav className="flex items-center gap-5 text-sm text-zinc-600" aria-label="Primary">
          <a className="hover:text-zinc-950" href="/spec/">
            Spec
          </a>
          <a className="hover:text-zinc-950" href="https://github.com/masterbelt">
            GitHub
          </a>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="mx-auto flex w-[min(1120px,calc(100%-32px))] justify-between gap-4 py-7 text-sm text-zinc-600">
        <span>&copy; {new Date().getFullYear()} Masterbelt</span>
        <a className="hover:text-zinc-950" href="https://github.com/masterbelt">
          GitHub
        </a>
      </footer>
    </div>
  );
}
