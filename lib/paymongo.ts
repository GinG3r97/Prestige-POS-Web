import "server-only";

const BASE = "https://api.paymongo.com/v1";

/** Basic auth header from the secret key (sk_test_… / sk_live_…). */
function authHeader() {
  const sk = process.env.PAYMONGO_SECRET_KEY;
  if (!sk) throw new Error("PAYMONGO_SECRET_KEY is not set");
  return "Basic " + Buffer.from(sk + ":").toString("base64");
}

/** Comma-separated method list, e.g. "card,gcash,paymaya". Defaults to the
 *  methods almost every PayMongo account has enabled. */
function methodTypes(): string[] {
  const raw = process.env.PAYMONGO_METHODS;
  return raw
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : ["card", "gcash", "paymaya"];
}

/**
 * Create a hosted PayMongo Checkout Session and return its id + checkout URL.
 * Supports cards, GCash, Maya, etc. — no card data touches our servers.
 */
export async function createCheckoutSession(opts: {
  amountCents: number;
  planLabel: string;
  description: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<{ id: string; url: string }> {
  const res = await fetch(`${BASE}/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    cache: "no-store",
    body: JSON.stringify({
      data: {
        attributes: {
          ...(opts.email ? { billing: { email: opts.email } } : {}),
          line_items: [
            {
              currency: "PHP",
              amount: opts.amountCents,
              name: opts.planLabel,
              quantity: 1,
            },
          ],
          payment_method_types: methodTypes(),
          description: opts.description,
          reference_number: opts.metadata.request_id,
          success_url: opts.successUrl,
          cancel_url: opts.cancelUrl,
          send_email_receipt: true,
          metadata: opts.metadata,
        },
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const detail = json?.errors?.[0]?.detail as string | undefined;
    throw new Error(detail || `PayMongo error (${res.status})`);
  }
  return {
    id: json.data.id as string,
    url: json.data.attributes.checkout_url as string,
  };
}
