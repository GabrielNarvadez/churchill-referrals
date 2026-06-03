"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { program: "double" | "friends" };

type FieldErrors = Partial<Record<string, string>>;

export function ReferralForm({ program }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirectAfterError, setRedirectAfterError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    setRedirectAfterError(null);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      program,
      referrer_email: String(fd.get("referrer_email") ?? ""),
      referrer_name: String(fd.get("referrer_name") ?? ""),
      friend_name: String(fd.get("friend_name") ?? ""),
      friend_email: String(fd.get("friend_email") ?? ""),
      friend_phone: String(fd.get("friend_phone") ?? ""),
      notes: String(fd.get("notes") ?? "") || undefined,
      consent: fd.get("consent") === "yes",
    };

    try {
      const res = await fetch("/api/refer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push(`/thanks?program=${program}&reward=${data.reward}`);
        return;
      }
      setServerError(data.message ?? "Something went wrong. Please try again.");
      if (data.redirect) setRedirectAfterError(data.redirect);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const label = "block text-sm font-bold text-navy mb-1";
  const input =
    "block w-full rounded-md border border-line bg-white px-3 py-2 text-ink shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20";
  const errText = "mt-1 text-xs text-red";

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-lg border border-line bg-white p-6 shadow-sm">
      <div className="grid gap-1">
        <label htmlFor="referrer_email" className={label}>
          Your email <span className="text-red">*</span>
        </label>
        <input id="referrer_email" name="referrer_email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" />
        {errors.referrer_email && <p className={errText}>{errors.referrer_email}</p>}
      </div>

      <div className="grid gap-1">
        <label htmlFor="referrer_name" className={label}>
          Your full name <span className="text-red">*</span>
        </label>
        <input id="referrer_name" name="referrer_name" type="text" required autoComplete="name" className={input} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-1">
          <label htmlFor="friend_name" className={label}>
            Friend's full name <span className="text-red">*</span>
          </label>
          <input id="friend_name" name="friend_name" type="text" required className={input} />
        </div>
        <div className="grid gap-1">
          <label htmlFor="friend_phone" className={label}>
            Friend's contact number <span className="text-red">*</span>
          </label>
          <input id="friend_phone" name="friend_phone" type="tel" required className={input} placeholder="04xx xxx xxx" />
        </div>
      </div>

      <div className="grid gap-1">
        <label htmlFor="friend_email" className={label}>
          Friend's email <span className="text-red">*</span>
        </label>
        <input id="friend_email" name="friend_email" type="email" required className={input} />
      </div>

      <div className="grid gap-1">
        <label htmlFor="notes" className={label}>
          Additional notes <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea id="notes" name="notes" rows={3} className={input} placeholder="Anything we should know about your friend's situation?" />
      </div>

      <label className="flex items-start gap-3 text-sm text-ink">
        <input type="checkbox" name="consent" value="yes" required className="mt-1 h-4 w-4 rounded border-line text-navy focus:ring-navy" />
        <span>
          I confirm that I have permission to share my friend's contact details with Churchill Education. <span className="text-red">*</span>
        </span>
      </label>

      {serverError && (
        <div className="rounded-md border border-red/30 bg-red/5 p-4 text-sm text-ink">
          <p className="font-bold text-red">We couldn't submit your referral</p>
          <p className="mt-1">{serverError}</p>
          {redirectAfterError && (
            <p className="mt-2">
              <a href={redirectAfterError} className="font-bold text-red underline">
                Go to the right program →
              </a>
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-red px-6 py-3 font-bold text-white shadow-sm transition hover:bg-red/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Refer a friend now"}
      </button>
    </form>
  );
}
