/** Plain wrapper for the whole /admin segment (including the public login). */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-surface-2">{children}</div>;
}
