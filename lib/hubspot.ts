const BASE = "https://api.hubapi.com";

function pat(): string {
  const t = process.env.HUBSPOT_CHURCHILL_PAT;
  if (!t) throw new Error("HUBSPOT_CHURCHILL_PAT not set");
  return t;
}

async function hs(path: string, init?: RequestInit) {
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
  if (p.lifecyclestage === ALUMNI_LIFECYCLE_STAGE_ID) return "alumni";
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
