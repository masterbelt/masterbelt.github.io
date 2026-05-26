import { LuBookOpen } from "react-icons/lu";

export function HomePage() {
  return (
    <section className="border-y border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-[420px] w-[min(1120px,calc(100%-32px))] flex-col justify-center py-14">
        <h1 className="max-w-3xl text-5xl font-black leading-none sm:text-7xl md:text-8xl">Masterbelt</h1>
        <div className="mt-8">
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-teal-900 bg-teal-900 px-5 font-bold text-white no-underline"
            href="/spec/"
          >
            <LuBookOpen aria-hidden="true" size={18} />
            Specification
          </a>
        </div>
      </div>
    </section>
  );
}
