import { FaGithub } from "react-icons/fa6";
import { LuBookOpen, LuHouse } from "react-icons/lu";

export function NotFoundPage() {
  return (
    <section className="border-y border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-[420px] w-[min(1120px,calc(100%-32px))] flex-col justify-center py-14">
        <p className="m-0 text-sm font-black uppercase tracking-wide text-zinc-500">404</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-black leading-tight">Page not found</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
          The requested page does not exist. The Masterbelt specification is the best starting point.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-teal-900 bg-teal-900 px-5 font-bold text-white no-underline"
            href="/spec/"
          >
            <LuBookOpen aria-hidden="true" size={18} />
            Specification
          </a>
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-5 font-bold text-zinc-800 no-underline hover:border-teal-700 hover:text-teal-900"
            href="/"
          >
            <LuHouse aria-hidden="true" size={18} />
            Home
          </a>
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-5 font-bold text-zinc-800 no-underline hover:border-teal-700 hover:text-teal-900"
            href="https://github.com/masterbelt"
          >
            <FaGithub aria-hidden="true" size={18} />
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
