import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";

export const metadata: Metadata = {
  title: "Terms of Service | Prestige POS",
  description: "The terms that govern your use of Prestige POS.",
};

const EFFECTIVE = "June 11, 2026";

export default function Terms() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-medium text-brand-deep">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-ink-subtle">Last updated {EFFECTIVE}</p>

        <div className="prose-legal mt-8">
          <p>
            Welcome to Prestige POS. These terms are the agreement between you
            and Prestige IT Solutions of General Santos City, Philippines
            (&ldquo;we&rdquo; or &ldquo;us&rdquo;). We have kept them short and
            in plain English. By creating an account, starting a trial, or
            using the app, you agree to them.
          </p>

          <h2>1. What Prestige POS is</h2>
          <p>
            Prestige POS is a point-of-sale app built for Philippine caf&eacute;s,
            restaurants, and shops. It lets you record sales, manage products
            and inventory, run cashier shifts, handle staff and payroll, and
            print receipts and reports. Your data lives in a secure cloud
            database, so it follows you across devices.
          </p>

          <h2>2. Your account</h2>
          <p>
            Your account, your staff PINs, and everything done under them are
            your responsibility. Keep your login details and PINs private. If
            you think someone else has access to your account, email us right
            away at{" "}
            <a href="mailto:hello@prestigeitsolutions.tech">
              hello@prestigeitsolutions.tech
            </a>
            .
          </p>

          <h2>3. Subscription and billing</h2>
          <p>
            Prestige POS is a subscription. You pay on our website at
            prestigeitsolutions.tech, not inside the app. The app itself is
            login-only. Our current plans are:
          </p>
          <ul>
            <li>
              <strong>Basic:</strong> &#8369;499 per month, per branch.
            </li>
            <li>
              <strong>Pro:</strong> &#8369;999 per month, per branch.
            </li>
            <li>
              <strong>Yearly:</strong> pay for 10 months, get 12. That is
              &#8369;4,990 a year for Basic or &#8369;9,990 a year for Pro.
            </li>
          </ul>
          <p>
            All prices are VAT inclusive. You can upgrade or downgrade your
            plan at any time. If plan prices ever change, we will tell you
            before your next billing date.
          </p>

          <h2>4. Free trial</h2>
          <p>
            Every new store gets a 14-day free trial with no card required. If
            you like the app, subscribe before the trial ends. If you do not,
            nothing is charged and your account simply pauses until you decide.
          </p>

          <h2>5. Cancellation and refunds</h2>
          <p>
            You can cancel anytime. When you cancel, your service keeps running
            until the end of the period you already paid for, then it stops
            renewing. We do not give pro-rated refunds for unused time, unless
            the law requires it. Before or after cancelling, you can ask us for
            an export of your data at any time.
          </p>

          <h2>6. Acceptable use</h2>
          <ul>
            <li>
              Use the app for lawful business only. Do not misuse it, disrupt
              it, or try to access other people&rsquo;s data.
            </li>
            <li>
              You are responsible for the accuracy of your products, prices,
              taxes, discounts, and the sales you record.
            </li>
            <li>
              You are responsible for your own tax and regulatory obligations,
              including permits, registrations, and the accuracy of any
              receipts or invoices you issue through the app.
            </li>
          </ul>

          <h2>7. Payments from your customers</h2>
          <p>
            Money your customers pay you for your goods and services (cash,
            e-wallet, QR, or bank transfer) goes straight between you and
            them. The app only records the amount and any reference you type
            in. We never hold, process, or settle those funds.
          </p>

          <h2>8. Your data is yours</h2>
          <p>
            Your store data belongs to you, full stop. We store it in a secure
            cloud database so the app can work, and that is all we use it for.
            You can export your data at any time, just ask us at{" "}
            <a href="mailto:hello@prestigeitsolutions.tech">
              hello@prestigeitsolutions.tech
            </a>
            . You can also delete your account from inside the app (Settings),
            which removes your store and its data from our active systems.
          </p>

          <h2>9. Availability and disclaimer</h2>
          <p>
            We work hard to keep Prestige POS fast and reliable, but no
            software is perfect. The service is provided &ldquo;as is&rdquo;
            and &ldquo;as available.&rdquo; We do not promise uninterrupted
            service, and we are not liable for losses caused by downtime,
            device problems, or network issues. We may update and improve the
            app over time.
          </p>

          <h2>10. Limitation of liability</h2>
          <p>
            To the maximum extent the law allows, Prestige IT Solutions is not
            liable for indirect, incidental, or consequential damages, or for
            lost profits, data, or goodwill arising from your use of the app.
            Our total liability is limited to the amount you paid us in the
            three months before the issue arose.
          </p>

          <h2>11. Changes to these terms</h2>
          <p>
            We may update these terms as the product grows. If we make a
            meaningful change, we will update the date at the top and let you
            know. Continuing to use the app after a change means you accept
            the updated terms.
          </p>

          <h2>12. Governing law</h2>
          <p>
            These terms are governed by the laws of the Republic of the
            Philippines. Any disputes will be handled by the competent courts
            of General Santos City.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions? We are happy to help. Email{" "}
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
