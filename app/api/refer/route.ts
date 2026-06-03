import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findContactByEmail,
  classifyReferrer,
  upsertReferredContact,
  ensureReferrerContact,
  addNoteToContact,
} from "@/lib/hubspot";

export const runtime = "nodejs";

const PayloadSchema = z.object({
  program: z.enum(["double", "friends"]),
  referrer_email: z.string().email().transform((v) => v.trim().toLowerCase()),
  referrer_name: z.string().min(1).max(120).transform((v) => v.trim()),
  friend_name: z.string().min(1).max(120).transform((v) => v.trim()),
  friend_email: z.string().email().transform((v) => v.trim().toLowerCase()),
  friend_phone: z.string().min(5).max(30).transform((v) => v.trim()),
  notes: z.string().max(2000).optional().transform((v) => v?.trim() || undefined),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you have permission to share your friend's details." }),
  }),
});

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

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

  const referrerName = splitName(parsed.referrer_name);
  const friendName = splitName(parsed.friend_name);

  let referrer = await findContactByEmail(parsed.referrer_email);
  const status = classifyReferrer(referrer);

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

  if (!referrer) {
    referrer = (await ensureReferrerContact({
      email: parsed.referrer_email,
      firstname: referrerName.first,
      lastname: referrerName.last,
    })) as any;
  }

  const programSource = parsed.program === "double" ? "double_referral" : "friends_of_churchill";

  await upsertReferredContact({
    email: parsed.friend_email,
    firstname: friendName.first,
    lastname: friendName.last,
    phone: parsed.friend_phone,
    referredByEmail: parsed.referrer_email,
    referredByFirstName: referrerName.first,
    referredByLastName: referrerName.last,
    referredByFullName: parsed.referrer_name,
    referrerIsAlumni: status === "alumni",
    programSource,
    notes: parsed.notes,
  });

  if (parsed.notes && referrer?.id) {
    await addNoteToContact(
      referrer.id,
      `Referral submitted (${programSource}). Note from referrer: ${parsed.notes}`
    );
  }

  return NextResponse.json({
    ok: true,
    program: parsed.program,
    referrer_status: status,
    reward: parsed.program === "double" ? 100 : 50,
  });
}
