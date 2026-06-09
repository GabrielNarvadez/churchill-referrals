const BASE = "https://api.hubapi.com";

function pat(): string {
  const t = process.env.HUBSPOT_CHURCHILL_PAT;
  if (!t) throw new Error("HUBSPOT_CHURCHILL_PAT not set");
  return t;
}

function isDryRun(): boolean {
  return process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
}

function isWriteMethod(method?: string): boolean {
  return ["POST", "PATCH", "PUT", "DELETE"].includes((method ?? "GET").toUpperCase());
}

function isReadPath(path: string): boolean {
  // Search endpoints use POST + body but are read operations.
  return path.includes("/search");
}

async function hs(path: string, init?: RequestInit) {
  if (isDryRun() && isWriteMethod(init?.method) && !isReadPath(path)) {
    const fakeId = `DRY_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[DRY_RUN] would ${init?.method} ${path}`);
    if (init?.body) {
      try { console.log("[DRY_RUN] body:", JSON.stringify(JSON.parse(String(init.body)), null, 2)); }
      catch { console.log("[DRY_RUN] body:", init.body); }
    }
    return { id: fakeId, properties: {}, dryRun: true };
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${pat()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(`HubSpot ${res.status}: ${body?.message ?? text}`);
    (err as any).status = res.status;
    (err as any).body = body;
    throw err;
  }
  return body;
}

export type AlumniStatus = "alumni" | "prospect" | "unknown";

const ALUMNI_LIFECYCLE_STAGE_ID = "217604175";
const PURCHASED_LIFECYCLE_STAGES = new Set([
  ALUMNI_LIFECYCLE_STAGE_ID,
  "customer",
  "evangelist",
  "255982886",
]);

export type ContactLookup = {
  id: string;
  properties: Record<string, string | null>;
};

export async function findContactByEmail(email: string): Promise<ContactLookup | null> {
  const body = await hs("/crm/v3/objects/contacts/search", {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
      ],
      properties: [
        "email",
        "firstname",
        "lastname",
        "alumni__c",
        "lifecyclestage",
        "referred_by___email",
        "referred_by__c",
      ],
      limit: 1,
    }),
  });
  return body.results?.[0] ?? null;
}

export function classifyReferrer(contact: ContactLookup | null): AlumniStatus {
  if (!contact) return "unknown";
  const p = contact.properties;
  const alumni = (p.alumni__c ?? "").toLowerCase();
  if (alumni === "yes" || alumni === "1" || alumni === "true") return "alumni";
  if (p.lifecyclestage && PURCHASED_LIFECYCLE_STAGES.has(p.lifecyclestage)) return "alumni";
  return "prospect";
}

export type CreateOrUpdateContactInput = {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  referredByEmail: string;
  referredByFirstName: string;
  referredByLastName: string;
  referredByFullName: string;
  referrerIsAlumni: boolean;
  programSource: "double_referral" | "friends_of_churchill";
  notes?: string;
};

export async function upsertReferredContact(input: CreateOrUpdateContactInput) {
  const properties: Record<string, string> = {
    email: input.email,
    lifecyclestage: "lead",
    hs_lead_status: "NEW",
    were_you_referred_to_churchill_by_someone_: "Yes",
    referred_by___email: input.referredByEmail,
    referred_by___first_name: input.referredByFirstName,
    referred_by___last_name: input.referredByLastName,
    referred_by__c: input.referredByFullName,
    is_the_referee_an_alumni_graduate__c: input.referrerIsAlumni ? "Yes" : "No",
    referral_program_source: input.programSource,
  };
  if (input.firstname) properties.firstname = input.firstname;
  if (input.lastname) properties.lastname = input.lastname;
  if (input.phone) properties.phone = input.phone;

  try {
    return await hs(`/crm/v3/objects/contacts/${encodeURIComponent(input.email)}?idProperty=email`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
  } catch (e: any) {
    if (e.status === 404) {
      return await hs("/crm/v3/objects/contacts", {
        method: "POST",
        body: JSON.stringify({ properties }),
      });
    }
    throw e;
  }
}

export async function ensureReferrerContact(input: {
  email: string;
  firstname: string;
  lastname: string;
}) {
  const existing = await findContactByEmail(input.email);
  if (existing) return existing;
  return await hs("/crm/v3/objects/contacts", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        email: input.email,
        firstname: input.firstname,
        lastname: input.lastname,
        lifecyclestage: "lead",
        hs_lead_status: "NEW",
      },
    }),
  });
}

// Referrals Tracking custom object (objectTypeId 2-24976820) → contacts associations.
// Per 2026-06-03 demo decision: all associations flow through the custom object,
// not contact-to-contact, to keep the referral lifecycle in one place.
const REFERRALS_OBJECT_TYPE = "2-24976820";
const ASSOC_REFERRAL_TO_NEW_CLIENT = 25;
const ASSOC_REFERRAL_TO_REFERRED_BY = 27;

export type CreateReferralRecordInput = {
  friendId: string;
  friendFullName: string;
  friendLifecycleStage: string;
  referrerId: string;
  referrerEmail: string;
  referrerFirstName: string;
  referrerFullName: string;
  referrerPhone?: string;
  referrerLifecycleStage: string;
  referralType:
    | "Churchill Alumni Referral"
    | "Friends of Churchill Referral"
    | "Referrer not in system"
    | "Not yet defined";
  submissionIdempotentId: string;
  notes?: string;
};

export async function createReferralRecord(input: CreateReferralRecordInput) {
  const today = new Date().toISOString().slice(0, 10);
  // new_client___full_name, new_client_lifecycle_stage, referred_by_full_name,
  // referred_by_first_name, referred_by_client_lifecycle_stage are calculated
  // on the custom object — HubSpot rejects writes to them.
  const properties: Record<string, string> = {
    name: `${input.friendFullName} ← ${input.referrerFullName} (${today})`,
    referral_type__c: input.referralType,
    lead_creation_date__c: today,
    new_client_full_name: input.friendFullName,
    new_client_hs_record_id: input.friendId,
    referred_by_email__c: input.referrerEmail,
    submission_idempotent_id: input.submissionIdempotentId,
  };
  if (input.referrerPhone) properties.referred_by_phone_number__c = input.referrerPhone;
  if (input.notes) properties.notes__c = input.notes;

  const referrerIsAccount = input.referrerLifecycleStage === "customer" ||
    input.referrerLifecycleStage === "217604175" ||
    input.referrerLifecycleStage === "evangelist" ||
    input.referrerLifecycleStage === "255982886";
  if (referrerIsAccount) {
    properties.referred_by__account__hs_record_id = input.referrerId;
  } else {
    properties.referred_by__lead__hs_record_id = input.referrerId;
  }

  return await hs(`/crm/v3/objects/${REFERRALS_OBJECT_TYPE}`, {
    method: "POST",
    body: JSON.stringify({ properties }),
  });
}

export async function associateReferralToContact(
  referralId: string,
  contactId: string,
  typeId: number
) {
  if (!referralId || !contactId) return null;
  return await hs(
    `/crm/v4/objects/${REFERRALS_OBJECT_TYPE}/${referralId}/associations/contacts/${contactId}`,
    {
      method: "PUT",
      body: JSON.stringify([
        { associationCategory: "USER_DEFINED", associationTypeId: typeId },
      ]),
    }
  );
}

export async function findExistingReferralByIdempotentId(idempotentId: string) {
  const body = await hs(`/crm/v3/objects/${REFERRALS_OBJECT_TYPE}/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "submission_idempotent_id", operator: "EQ", value: idempotentId }] },
      ],
      properties: ["name", "submission_idempotent_id"],
      limit: 1,
    }),
  });
  return body.results?.[0] ?? null;
}

export const ASSOC_TYPES = {
  REFERRAL_TO_NEW_CLIENT: ASSOC_REFERRAL_TO_NEW_CLIENT,
  REFERRAL_TO_REFERRED_BY: ASSOC_REFERRAL_TO_REFERRED_BY,
};

export async function deleteContact(contactId: string) {
  if (!contactId) return null;
  return await hs(`/crm/v3/objects/contacts/${contactId}`, { method: "DELETE" });
}

export async function addNoteToContact(contactId: string, body: string) {
  const created = await hs("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        hs_note_body: body,
        hs_timestamp: new Date().toISOString(),
      },
    }),
  });
  await hs(
    `/crm/v3/objects/notes/${created.id}/associations/contacts/${contactId}/note_to_contact`,
    { method: "PUT" }
  );
  return created;
}
