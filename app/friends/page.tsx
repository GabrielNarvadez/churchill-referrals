import { ChurchillFooter, ChurchillHeader } from "@/components/ChurchillHeader";
import { ReferralForm } from "@/components/ReferralForm";

export const metadata = {
  title: "Friends of Churchill Referral — Churchill Education",
  description: "Refer a friend before your own enrolment and earn a $50 reward.",
};

export default function FriendsReferral() {
  return (
    <>
      <ChurchillHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="text-center">
          <p className="text-xs font-bold uppercase tracking-[2px] text-accent">Exploring Churchill</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-navy sm:text-5xl">
            Friends of Churchill Referral Reward
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink">
            Refer a friend and earn rewards when they successfully enrol — even <strong>before</strong> you complete your own first qualification purchase.
          </p>
        </section>

        <section className="mt-10">
          <div className="mx-auto max-w-md rounded-lg border border-line border-t-4 border-t-accent bg-white p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Your reward</p>
            <p className="mt-1 text-3xl font-black text-accent">$50 referral reward</p>
            <p className="mt-2 text-sm text-muted">Paid once your friend successfully enrols.</p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-navy">How it works</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["1. Submit referral details", "Send us your friend's details using the form below."],
              ["2. We contact your friend", "Our team reaches out and discusses qualification options."],
              ["3. Your friend enrols", "Your friend enrols in a qualification before you do."],
              ["4. You receive $50", "Your reward is processed after their enrolment is confirmed."],
            ].map(([title, body]) => (
              <li key={title} className="rounded-lg border border-line bg-white p-5">
                <p className="font-black text-navy">{title}</p>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-navy">Refer a friend now</h2>
          <p className="mt-2 text-sm text-muted">
            Already a Churchill alumni? You qualify for the higher reward —{" "}
            <a href="/double" className="font-bold text-accent underline">switch to the Double Referral Program</a>.
          </p>
          <div className="mt-6">
            <ReferralForm program="friends" />
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-black text-navy">Frequently asked questions</h2>
          <dl className="mt-4 grid gap-5 text-sm">
            <div>
              <dt className="font-bold text-navy">Who can join this program?</dt>
              <dd className="mt-1 text-ink">Anyone currently exploring qualification opportunities with Churchill Education, who hasn't yet purchased their first qualification.</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">When do I receive my $50 reward?</dt>
              <dd className="mt-1 text-ink">Once your referred friend successfully enrols in their first qualification with Churchill.</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">Do I need to purchase anything to participate?</dt>
              <dd className="mt-1 text-ink">No purchase is required to join. You can refer first.</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">How do I become an Alumni?</dt>
              <dd className="mt-1 text-ink">Anyone who graduates with a qualification through Churchill Education automatically becomes an Alumni. As an Alumni you are eligible to receive a higher reward for referring a friend.</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">Can I refer more than one friend?</dt>
              <dd className="mt-1 text-ink">Yes — there&apos;s currently no cap. You earn $50 for each qualified referral.</dd>
            </div>
          </dl>
        </section>
      </main>
      <ChurchillFooter />
    </>
  );
}
