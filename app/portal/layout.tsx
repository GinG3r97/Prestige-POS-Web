import type { Viewport } from "next";

// Portal is a phone-first web app — lock the viewport so it auto-fits every
// device and a stray pinch/double-tap can't zoom the UI out of place.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#15110d",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
