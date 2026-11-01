import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

function BrandMark() {
  return (
    <Link
      aria-label="Trainoryx home"
      className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b9c39] focus-visible:ring-offset-4"
      href="/"
    >
      <svg
        aria-hidden="true"
        className="size-11 shrink-0"
        fill="none"
        viewBox="0 0 44 44"
      >
        <rect fill="#10251B" height="44" rx="13" width="44" />
        <path d="M8 10h28v7H25v18h-7V17H8v-7Z" fill="white" />
        <path d="M22 17h3v18h-3z" fill="#A3E635" />
      </svg>
      <span className="text-[15px] font-extrabold tracking-[0.2em] text-[#14251c]">
        TRAINORYX
      </span>
    </Link>
  );
}

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f9f6] text-[#17231b]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <BrandMark />
        <span className="rounded-full border border-[#dce6de] bg-white px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[#52645a] sm:px-4 sm:text-[11px]">
          COACH ACCESS
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-5 pb-8 pt-3 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)] lg:gap-16 lg:px-12 lg:pb-12">
        <section
          aria-labelledby="auth-brand-heading"
          className="hidden py-10 lg:block"
        >
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.2em] text-[#4f7d37]">
              COACHING, IN FOCUS
            </p>
            <h1
              className="mt-6 text-5xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#14231a] xl:text-[58px]"
              id="auth-brand-heading"
            >
              Make every coaching decision count.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#5c6b61]">
              A calmer home for your coaching work, from the first plan to the
              progress that follows.
            </p>

            <div className="mt-12 flex items-start gap-4 border-t border-[#dce6de] pt-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f4d7] text-[#2d641e]">
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="m4 10.5 3.8 3.8L16 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-[#203329]">
                  Built around one-to-one coaching
                </p>
                <p className="mt-1 text-sm leading-6 text-[#65746a]">
                  Keep training, nutrition, and client progress in view.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="auth-page-title"
          className="w-full rounded-[26px] border border-[#e2e9e3] bg-white px-5 py-7 shadow-[0_20px_60px_rgba(22,48,31,0.06)] sm:px-9 sm:py-10 lg:max-w-[520px] lg:justify-self-end lg:px-11 lg:py-12"
        >
          <div className="mb-8">
            <p className="text-[11px] font-bold tracking-[0.18em] text-[#5c833f]">
              {eyebrow}
            </p>
            <h2
              className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#18271e]"
              id="auth-page-title"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#68766d]">
              {description}
            </p>
          </div>
          {children}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-5 pb-5 text-center text-[11px] font-medium tracking-[0.1em] text-[#87938a] sm:px-8 lg:px-12 lg:text-left">
        TRAINORYX · COACH WORKSPACE
      </footer>
    </div>
  );
}
