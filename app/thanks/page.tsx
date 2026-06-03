import Link from "next/link";
import { ChurchillFooter, ChurchillHeader } from "@/components/ChurchillHeader";

export const metadata = {
  title: "Thanks for your referral — Churchill Education",
  robots: { index: false, follow: false },
};

type SP = { program?: string; reward?: string };

export default async function Thanks({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const reward = sp.reward ?? "50";
  const program = sp.program === "double" ? "Double Referral Reward" : "Friends of Churchill";
  return (
    <>
      <ChurchillHeader />
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[2px] text-red">{program}</p>
        <h1 className="mt-3 text-4xl font-black text-navy">Thanks — we've got it.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Your referral has been submitted to the Churchill team. We'll reach out to your friend shortly to discuss their qualification options.
        </p>
        <div className="mx-auto mt-8 max-w-md rounded-lg border border-line bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">When your friend enrols</p>
          <p className="mt-1 text-2xl font-black text-navy">You'll receive ${reward}</p>
          <p className="mt-2 text-sm text-muted">We'll be in touch via the email you provided.</p>
        </div>
        <Link href="/" className="mt-10 inline-block text-sm font-bold text-red underline">
          Refer another friend
        </Link>
      </main>
      <ChurchillFooter />
    </>
  );
}
