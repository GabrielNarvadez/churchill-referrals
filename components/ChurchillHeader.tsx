import Image from "next/image";

export function ChurchillHeader() {
  return (
    <header className="border-b-[3px] border-navy bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
        <Image
          src="/churchill-logo.png"
          alt="Churchill Education"
          width={180}
          height={54}
          priority
        />
      </div>
    </header>
  );
}

export function ChurchillFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-5xl px-6 py-6 text-xs text-muted">
        © Churchill Education. All rights reserved.
      </div>
    </footer>
  );
}
