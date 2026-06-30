import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findContactByEmail,
  classifyReferrer,
  upsertReferredContact,
  markReferrerSubmitted,
  addNoteToContact,
  createReferralRecord,
  associateReferralToContact,
  findExistingReferralByIdempotentId,
  deleteContact,
  ASSOC_TYPES,
} from "@/lib/hubspot";

export const runtime = "nodejs";
export const maxDuration = 60;

const PayloadSchema = z.object({
  program: z.enum(["double", "friends"]),
  referrer_email: z.string().email().transform((v) => v.trim().toLowerCase()),
  referrer_first_name: z.string().min(1).max(60).transform((v) => v.trim()),
  referrer_last_name: z.string().min(1).max(60).transform((v) => v.trim()),
  friend_first_name: z.string().min(1).max(60).transform((v) => v.trim()),
  friend_last_name: z.string().min(1).max(60).transform((v) => v.trim()),
  friend_email: z.string().email().transform((v) => v.trim().toLowerCase()),
  friend_phone: z.string().min(5).max(30).transform((v) => v.trim()),
  notes: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you have permission to share your friend's details." }),
  }),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    const json = await req.json();
    parsed = PayloadSchema.parse(json);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "invalid_input", message: e.issues?.[0]?.message ?? "Please check the form and try again." },
      { status: 400 }
    );
  }

  if (parsed.referrer_email === parsed.friend_email) {
    return NextResponse.json(
      { ok: false, code: "same_email", message: "Your friend's email must be different from yours." },
      { status: 400 }
    );
  }

  const referrerFullName = `${parsed.referrer_first_name} ${parsed.referrer_last_name}`.trim();

  const programSource = parsed.program === "double" ? "double_referral" : "friends_of_churchill";
  const referralType =
    parsed.program === "double" ? "Churchill Alumni Referral" : "Friends of Churchill Referral";
  const idempotentId = `${parsed.referrer_email}|${parsed.friend_email}|${programSource}`;

  const [existingFriend, referrer, existingReferral] = await Promise.all([
    findContactByEmail(parsed.friend_email),
    findContactByEmail(parsed.referrer_email),
    findExistingReferralByIdempotentId(idempotentId),
  ]);

  if (existingFriend) {
    const existingReferrer = (existingFriend.properties.referred_by___email ?? "").toLowerCase();
    if (existingReferrer && existingReferrer === parsed.referrer_email) {
      return NextResponse.json(
        {
          ok: false,
          code: "already_referred_by_you",
          message: `You've already referred ${parsed.friend_first_name} — we have them on record from your earlier referral. There's nothing more to do, we'll be in touch when they enrol.`,
        },
        { status: 409 }
      );
    }
    if (existingReferrer) {
      return NextResponse.json(
        {
          ok: false,
          code: "already_referred_by_someone_else",
          message: `Thanks for thinking of ${parsed.friend_first_name}! They've already been referred to Churchill by someone else, so a second referral reward can't be applied. If you believe this is a mistake, get in touch and we'll review.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        code: "friend_already_in_system",
        message: `Thanks for thinking of ${parsed.friend_first_name}! It looks like they're already in our records, so we can't apply a referral reward for them this time. Referrals can only be made for people new to Churchill. If you think this is a mistake, get in touch and we'll take a look.`,
      },
      { status: 409 }
    );
  }

  const status = classifyReferrer(referrer);

  if (status === "unknown" || !referrer) {
    return NextResponse.json(
      {
        ok: false,
        code: "referrer_not_in_system",
        message:
          "We couldn't find your email in our Churchill records. To refer a friend you need to be a Churchill contact first — try the email you used when you originally enquired or enrolled. If you've never been in touch with us before, get in touch and we'll get you set up.",
      },
      { status: 403 }
    );
  }

  if (parsed.program === "double" && status !== "alumni") {
    return NextResponse.json(
      {
        ok: false,
        code: "not_alumni",
        message:
          "We couldn't verify your alumni status. The $100 Double Referral Program is for Churchill alumni who have completed a qualification. If you're currently exploring qualifications, head to the Friends of Churchill program instead.",
        redirect: "/friends",
      },
      { status: 403 }
    );
  }

  if (existingReferral) {
    return NextResponse.json(
      {
        ok: false,
        code: "duplicate_referral_submission",
        message: `You've already submitted this referral for ${parsed.friend_first_name}. We've got it on record — no action needed.`,
      },
      { status: 409 }
    );
  }

  const friend = await upsertReferredContact({
    email: parsed.friend_email,
    firstname: parsed.friend_first_name,
    lastname: parsed.friend_last_name,
    phone: parsed.friend_phone,
    referredByEmail: parsed.referrer_email,
    referredByFirstName: parsed.referrer_first_name,
    referredByLastName: parsed.referrer_last_name,
    referredByFullName: referrerFullName,
    referrerIsAlumni: status === "alumni",
    programSource,
    notes: parsed.notes,
  });

  // Stamp the referrer-side trigger props so Workflow B ("Thanks For Your
  // Referral") fires. referrer is guaranteed present here (403'd earlier if not).
  // Best-effort: a failure here must not fail the referral the user just made.
  if (referrer?.id) {
    try {
      await markReferrerSubmitted({
        contactId: referrer.id,
        programSource,
        submittedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("markReferrerSubmitted failed", e);
    }
  }

  let referralId: string | undefined;
  if (friend?.id && referrer?.id) {
    const referrerLifecycleStage = referrer.properties.lifecyclestage ?? "lead";
    try {
      const referral = await createReferralRecord({
        friendId: friend.id,
        friendFullName: `${parsed.friend_first_name} ${parsed.friend_last_name}`.trim(),
        friendLifecycleStage: "lead",
        referrerId: referrer.id,
        referrerEmail: parsed.referrer_email,
        referrerFirstName: parsed.referrer_first_name,
        referrerFullName: referrerFullName,
        referrerPhone: undefined,
        referrerLifecycleStage,
        referralType,
        submissionIdempotentId: idempotentId,
        notes: parsed.notes,
      });
      referralId = referral?.id;

      if (referralId) {
        await Promise.all([
          associateReferralToContact(referralId, friend.id, ASSOC_TYPES.REFERRAL_TO_NEW_CLIENT),
          associateReferralToContact(referralId, referrer.id, ASSOC_TYPES.REFERRAL_TO_REFERRED_BY),
        ]);
      }
    } catch (e: any) {
      // Rollback the friend contact so a retry doesn't hit "already in system"
      try { await deleteContact(friend.id); } catch { /* ignore */ }

      const isScopeIssue = e?.status === 403 || e?.body?.category === "MISSING_SCOPES";
      console.error("Referral write failed", { status: e?.status, body: e?.body });
      return NextResponse.json(
        {
          ok: false,
          code: isScopeIssue ? "config_missing_scope" : "referral_write_failed",
          message: isScopeIssue
            ? "Our referral system isn't fully connected yet — please try again shortly. If this keeps happening, get in touch with the Churchill team."
            : "We hit a snag saving your referral. Please try again in a minute. If it keeps happening, get in touch with the Churchill team.",
        },
        { status: 503 }
      );
    }
  }

  if (parsed.notes && referrer?.id) {
    try {
      await addNoteToContact(
        referrer.id,
        `Referral submitted (${programSource}). Note from referrer: ${parsed.notes}`
      );
    } catch { /* note failure is non-fatal */ }
  }

  return NextResponse.json({
    ok: true,
    program: parsed.program,
    referrer_status: status,
    reward: parsed.program === "double" ? 100 : 50,
    referral_id: referralId,
  });
}
