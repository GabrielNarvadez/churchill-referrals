import { ChurchillFooter, ChurchillHeader } from "@/components/ChurchillHeader";
import { ReferralForm } from "@/components/ReferralForm";

export const metadata = {
  title: "Double Referral Rewards — Churchill Education",
  description: "Refer a friend to Churchill Education and you'll both be rewarded when they enrol in their first qualification.",
};

export default function DoubleReferral() {
  return (
    <>
      <ChurchillHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="text-center">
          <p className="text-xs font-bold uppercase tracking-[2px] text-accent">Churchill Alumni</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-navy sm:text-5xl">
            Double Referral Rewards
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink">
            Refer a friend to Churchill Education and you'll both be rewarded when they enrol in their first qualification.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line border-t-4 border-t-navy bg-white p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">You Get</p>
            <p className="mt-1 text-3xl font-black text-navy">$100 reward</p>
          </div>
          <div className="rounded-lg border border-line border-t-4 border-t-accent bg-white p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">They Get</p>
            <p className="mt-1 text-3xl font-black text-accent">$100 off first qualification</p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black text-navy">How it works</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1. Submit a referral", "Send us your friend's details using the form below."],
              ["2. We contact your friend", "Our team guides them through qualification options and enrolment."],
              ["3. Your friend enrols", "Your friend enrols in their first qualification with Churchill Education!"],
              ["4. You both get rewarded", "You receive a $100 referral reward. Your friend gets $100 off their qualification fee."],
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
          <div className="mt-6">
            <ReferralForm program="double" />
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-line bg-white p-6">
          <h2 className="text-xl font-black text-navy">Frequently asked questions</h2>
          <dl className="mt-4 grid gap-5 text-sm">
            <div>
              <dt className="font-bold text-navy">Who can join?</dt>
              <dd className="mt-1 text-ink">Any Churchill Education Alumni.</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">When do I receive my $100 reward?</dt>
              <dd className="mt-1 text-ink">Once your referred friend enrols and pays for their first qualification with Churchill Education, you will receive an email notification asking how you would like to receive your reward (Gift Card, Bank Transfer, Donation, Qualification Credit).</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">How does my friend get the $100 discount?</dt>
              <dd className="mt-1 text-ink">It's automatically applied to their qualification fee during enrolment by our team.</dd>
            </div>
            <div>
              <dt className="font-bold text-navy">Can I refer more than one friend?</dt>
              <dd className="mt-1 text-ink">Yes — there's currently no cap. You earn $100 for each qualified referral.</dd>
            </div>
          </dl>
        </section>
      </main>
      <ChurchillFooter />
    </>
  );
}
