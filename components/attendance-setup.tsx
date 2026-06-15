"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { MapPin, Loader2, Check, Printer, Copy } from "lucide-react";
import { setGeofence } from "@/app/app/attendance/actions";

const RADII = [100, 200, 300, 500];

export function AttendanceSetup({
  storeCode,
  businessName,
  geoSet,
  geoRadius,
}: {
  storeCode: string;
  businessName: string;
  geoSet: boolean;
  geoRadius: number;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [radius, setRadius] = useState(geoRadius);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/attend?s=${storeCode}`;

  function pinLocation() {
    setBusy(true);
    setMsg(null);
    if (!navigator.geolocation) {
      setBusy(false);
      setMsg("This device has no location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const res = await setGeofence(p.coords.latitude, p.coords.longitude, radius);
        setBusy(false);
        if (!res.ok) {
          setMsg(res.error ?? "Could not save.");
          return;
        }
        setMsg("Store location saved. Geofence is ON.");
        router.refresh();
      },
      () => {
        setBusy(false);
        setMsg("Turn on location and allow access, then try again.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div className="space-y-4">
      {/* Printable poster */}
      <div className="rounded-3xl border border-hairline bg-surface-1 p-6 text-center shadow-card print:border-0 print:shadow-none">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-deep">{businessName}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Scan to clock in / out</h2>
        <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-1 ring-hairline">
          {origin ? (
            <QRCodeSVG value={url} size={208} level="M" />
          ) : (
            <div className="h-52 w-52" />
          )}
        </div>
        <p className="mt-3 text-[13px] text-ink-muted">
          Open your camera, point at the code, then pick your name and enter your PIN.
        </p>
        <p className="mt-1 text-[11px] font-mono text-ink-subtle">Store ID {storeCode}</p>
      </div>

      {/* Controls (hidden when printing) */}
      <div className="print:hidden space-y-4">
        <button
          onClick={() => window.print()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-deep"
        >
          <Printer size={16} /> Print the QR poster
        </button>

        <div className="rounded-2xl border border-hairline bg-surface-1 p-4 shadow-card">
          <div className="flex items-center gap-2">
            <MapPin size={16} className={geoSet ? "text-green-600" : "text-ink-muted"} />
            <span className="text-sm font-bold text-ink">
              {geoSet ? "Geofence is ON" : "Geofence is OFF"}
            </span>
            {geoSet && (
              <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                within {geoRadius} m
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[12px] text-ink-muted">
            {geoSet
              ? "Staff can only clock in within range of the store. Stand at your store and re-set anytime."
              : "Stand inside your store and tap below — staff will then only be able to clock in here."}
          </p>

          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Allowed distance</p>
            <div className="flex gap-1.5">
              {RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`flex-1 rounded-lg py-2 text-[12px] font-bold transition ${
                    radius === r ? "bg-brand text-white" : "bg-surface-2 text-ink-muted"
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={pinLocation}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-surface-2 px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-surface-3 disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
            {geoSet ? "Update store location (I'm here)" : "Set store location (I'm here)"}
          </button>
          {msg && (
            <p className={`mt-2 flex items-center gap-1.5 text-[12px] font-semibold ${msg.includes("ON") || msg.includes("saved") ? "text-green-700" : "text-red-600"}`}>
              {(msg.includes("ON") || msg.includes("saved")) && <Check size={13} />} {msg}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-hairline bg-surface-1 p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Direct link</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-left"
          >
            <span className="truncate text-[12px] text-ink">{url}</span>
            <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-brand-deep">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
