import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Prestige POS",
  description: "How Prestige POS collects, uses, and protects your data.",
};

const EFFECTIVE = "June 11, 2026";

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-medium text-brand-deep">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-ink-subtle">Last updated {EFFECTIVE}</p>

        <div className="prose-legal mt-8">
          <p>
            Your store&rsquo;s data is the heart of your business, so we keep
            this simple and honest. This policy explains what Prestige POS
            collects, why, where it lives, and what you can do with it. It is
            written by Prestige IT Solutions (&ldquo;we&rdquo; or
            &ldquo;us&rdquo;) of General Santos City, Philippines.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> your email address and
              owner name, so we can create and protect your account.
            </li>
            <li>
              <strong>Your business records:</strong> the store details,
              products, prices, inventory, staff, sales, and orders you enter.
              We store these for one reason only: so the app works for you.
            </li>
            <li>
              <strong>Device basics:</strong> simple technical details like
              app version and device type, which help us fix bugs and keep
              things running smoothly.
            </li>
            <li>
              <strong>Payment notes:</strong> card and e-wallet payments from
              your customers happen outside the app. We keep only the amount
              and any reference number you type in, for your own records. We
              never collect or store cardholder data.
            </li>
          </ul>

          <h2>Why we collect it</h2>
          <ul>
            <li>To run the point-of-sale service for your store.</li>
            <li>To keep your account secure and block unauthorized access.</li>
            <li>To answer your questions and support you.</li>
            <li>To maintain, troubleshoot, and improve the app.</li>
          </ul>

          <h2>Where your data lives</h2>
          <p>
            Your data is stored in a secure cloud database hosted by Supabase.
            It travels over encrypted connections (HTTPS/TLS) and sits behind
            access controls. Inside the app, your account login and staff PINs
            keep it locked to your team.
          </p>

          <h2>What we never do</h2>
          <p>
            We do not sell your data. We do not use your business or customer
            records for advertising. We only share data with the trusted
            providers that keep the app running, like our cloud database host,
            or when the law requires it. That is the whole list.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your business data for as long as your account is active,
            so the app can do its job. If you delete your account, your store
            and its data are removed from our active systems.
          </p>

          <h2>Your rights as the owner</h2>
          <ul>
            <li>
              <strong>Access and correction:</strong> view and edit your store
              data anytime, right inside the app.
            </li>
            <li>
              <strong>Export:</strong> your data stays yours. Ask us for a
              full export at any time and we will send it to you.
            </li>
            <li>
              <strong>Deletion:</strong> delete your account and store data
              from inside the app (Settings), or email us and we will handle
              it.
            </li>
          </ul>

          <h2>Children</h2>
          <p>
            Prestige POS is a business tool, not a kids&rsquo; app. We do not
            knowingly collect personal information from children under 13.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            If we change this policy in a meaningful way, we will update the
            date at the top and let you know.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about your privacy? Email us anytime at{" "}
            <a href="mailto:hello@prestigeitsolutions.tech">
              hello@prestigeitsolutions.tech
            </a>
            . Prestige IT Solutions, General Santos City, Philippines.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
