/* eslint-disable @next/next/no-img-element */

export function ChurchillHeader() {
  return (
    <header className="bg-navy shadow-[0_0_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex max-w-[1200px] items-center px-5 py-[30px] pb-[50px] sm:py-[30px] sm:pb-[50px]">
        <a href="https://www.churchilleducation.edu.au/" className="block w-[220px]">
          <img
            src="/churchill-logo.svg"
            alt="Churchill Education"
            className="block max-w-full"
          />
        </a>
      </div>
    </header>
  );
}

export function ChurchillFooter() {
  return (
    <footer className="bg-navy py-7">
      <div className="mx-auto max-w-[1200px] px-5 text-center">
        <a href="https://www.churchilleducation.edu.au/" className="inline-block">
          <img
            src="/churchill-logo.svg"
            alt="Churchill Education"
            className="mx-auto block h-10 w-auto opacity-90"
          />
        </a>
        <p className="mt-3 text-xs text-white/70">
          © Churchill Education. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
