import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Prestige POS",
  description: "How Prestige POS collects, uses, and protects your data.",
};

const EFFECTIVE = "June 7, 2026";

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-medium text-brand-deep">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-ink-subtle">Effective {EFFECTIVE}</p>

        <div className="prose-legal mt-8">
          <p>
            Prestige IT Solutions (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) respects your privacy. This Privacy Policy explains
            what information the Prestige POS application (&ldquo;the App&rdquo;)
            collects, how we use it, and the choices you have.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account information</strong> — your email address and owner
              name, used to create and secure your account.
            </li>
            <li>
              <strong>Business data you enter</strong> — your store details,
              products, prices, inventory, staff, and the sales and orders you
              record. This is used solely to operate the point-of-sale for you.
            </li>
            <li>
              <strong>Payment records</strong> — card and e-wallet payments are
              processed outside the App. We store only the amount and any reference
              number you enter, for your own records. We do not collect or store
              cardholder data.
            </li>
          </ul>

          <h2>How we use your information</h2>
          <ul>
            <li>To provide and operate the point-of-sale service for your store.</li>
            <li>To secure your account and prevent unauthorized access.</li>
            <li>To provide support and respond to your requests.</li>
            <li>To maintain, improve, and troubleshoot the App.</li>
          </ul>

          <h2>What we do not do</h2>
          <p>
            We do not sell your data. We do not use your business or customer data
            for advertising. We do not share your data with third parties except
            trusted service providers who help us run the App (such as our secure
            cloud database host), or where required by law.
          </p>

          <h2>How your data is protected</h2>
          <p>
            Your data is transmitted over encrypted connections (HTTPS/TLS) and
            stored with our cloud provider under access controls. Access within the
            App is protected by your account login and staff PINs.
          </p>

          <h2>Data retention</h2>
          <p>
            We retain your business data for as long as your account is active so
            the App can operate. When you delete your account, your store and its
            associated data are removed from our active systems.
          </p>

          <h2>Your choices and rights</h2>
          <ul>
            <li>
              <strong>Access &amp; correction</strong> — you can view and edit your
              store data at any time within the App.
            </li>
            <li>
              <strong>Account deletion</strong> — you can delete your account and
              store data from within the App (Settings), or by contacting us.
            </li>
            <li>
              <strong>Requests</strong> — to access, correct, or delete data, email
              us at{" "}
              <a href="mailto:hello@prestigeitsolutions.tech">
                hello@prestigeitsolutions.tech
              </a>
              .
            </li>
          </ul>

          <h2>Children</h2>
          <p>
            The App is intended for business use and is not directed to children
            under 13. We do not knowingly collect personal information from
            children.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes
            will be reflected by updating the effective date above.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about your privacy or this policy? Contact us at{" "}
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
