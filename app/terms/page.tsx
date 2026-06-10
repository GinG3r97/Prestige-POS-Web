import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";

export const metadata: Metadata = {
  title: "Terms of Service — Prestige POS",
  description: "The terms that govern your use of Prestige POS.",
};

const EFFECTIVE = "June 7, 2026";

export default function Terms() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-medium text-brand-deep">Legal</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-ink-subtle">Effective {EFFECTIVE}</p>

        <div className="prose-legal mt-8">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
            use of the Prestige POS application and related services
            (&ldquo;the App&rdquo;), provided by Prestige IT Solutions
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating
            an account or using the App, you agree to these Terms.
          </p>

          <h2>1. The service</h2>
          <p>
            Prestige POS is a point-of-sale application that lets you record sales,
            manage products and inventory, run cashier shifts, manage staff and
            payroll, and produce receipts and reports for your business. We work to
            keep the service reliable, but we provide it on an &ldquo;as is&rdquo;
            and &ldquo;as available&rdquo; basis.
          </p>

          <h2>2. Your account</h2>
          <p>
            You are responsible for your account, your staff PINs, and all activity
            that occurs under them. Keep your login and PINs confidential. Notify us
            promptly at{" "}
            <a href="mailto:hello@prestigeitsolutions.tech">
              hello@prestigeitsolutions.tech
            </a>{" "}
            if you believe your account has been compromised.
          </p>

          <h2>3. Your responsibilities</h2>
          <ul>
            <li>
              The accuracy of your products, prices, taxes, discounts, and the
              sales you record is your responsibility.
            </li>
            <li>
              You are responsible for your own tax and regulatory compliance,
              including any registration, permits, and the accuracy of receipts or
              invoices issued through the App.
            </li>
            <li>
              You agree to use the App lawfully and not to misuse, disrupt, or
              attempt to gain unauthorized access to the service.
            </li>
          </ul>

          <h2>4. Payments to you</h2>
          <p>
            Payments your customers make for your goods and services (cash,
            e-wallet, QR, or bank transfer) are between you and your customers. The
            App records the amount and any reference you enter; it does not process,
            hold, or settle those funds.
          </p>

          <h2>5. Availability and changes</h2>
          <p>
            We may update, improve, or change the App from time to time. We do not
            guarantee uninterrupted service and are not liable for losses arising
            from downtime, device, or network issues. We may update these Terms;
            continued use of the App after a change means you accept the updated
            Terms.
          </p>

          <h2>6. Account cancellation and deletion</h2>
          <p>
            You may delete your account at any time from within the App
            (Settings). Deleting your account removes your store and its associated
            data from our active systems. You may also contact us to request
            deletion.
          </p>

          <h2>7. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Prestige IT Solutions shall not
            be liable for any indirect, incidental, or consequential damages, or for
            any loss of profits, data, or goodwill, arising from your use of the
            App.
          </p>

          <h2>8. Governing law</h2>
          <p>
            These Terms are governed by the laws of the Republic of the
            Philippines. Any disputes will be brought before the competent courts of
            General Santos City.
          </p>

          <h2>9. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
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
