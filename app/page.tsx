import Link from "next/link";
import { ChurchillFooter, ChurchillHeader } from "@/components/ChurchillHeader";

export default function Home() {
  return (
    <>
      <ChurchillHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-black text-navy">Refer a friend to Churchill Education</h1>
        <p className="mt-3 text-muted">Choose the program that applies to you.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/double" className="block rounded-lg border border-line border-t-4 border-t-navy bg-white p-6 transition hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Alumni</p>
            <p className="mt-1 text-xl font-black text-navy">Double Referral Reward</p>
            <p className="mt-2 text-sm text-muted">You receive $100. Your friend gets $100 off their first qualification.</p>
          </Link>
          <Link href="/friends" className="block rounded-lg border border-line border-t-4 border-t-red bg-white p-6 transition hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Prospect</p>
            <p className="mt-1 text-xl font-black text-red">Friends of Churchill</p>
            <p className="mt-2 text-sm text-muted">Refer a friend before your own enrolment and earn $50.</p>
          </Link>
        </div>
      </main>
      <ChurchillFooter />
    </>
  );
}
