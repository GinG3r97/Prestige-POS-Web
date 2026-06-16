"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LogOut, Camera, RefreshCw, Loader2, Check, X, MapPin,
  CalendarDays, Clock3, TimerOff, Plane,
} from "lucide-react";
import {
  punch, fileRequest, portalSignOut,
  type PortalMe, type DaySummary, type PortalRequest, type LeaveType,
} from "@/app/portal/actions";

const WD = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minToTime(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60), m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
const hrs = (min: number) => (min / 60).toFixed(min % 60 === 0 ? 0 : 1) + "h";

export function PortalDashboard({
  me, today, summary, open, requests, leaveTypes,
}: {
  me: NonNullable<PortalMe>;
  today: string;
  summary: DaySummary;
  open: boolean;
  requests: PortalRequest[];
  leaveTypes: LeaveType[];
}) {
  const router = useRouter();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSelfie, setShowSelfie] = useState(false);
  const [fileKind, setFileKind] = useState<"leave" | "ot" | "undertime" | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const first = me.name.split(" ")[0];

  async function doPunch(selfie: string) {
    setBusy(true);
    const res = await punch({
      kind: open ? "out" : "in",
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      selfie,
      device: navigator.userAgent.slice(0, 120),
    });
    setBusy(false);
    setShowSelfie(false);
    if (!res.ok) {
      setToast(res.error ?? "Could not record.");
      return;
    }
    setToast(`Clocked ${res.result?.kind === "in" ? "in" : "out"} · ${res.result?.at}`);
    router.refresh();
  }

  const flags: { label: string; tone: "warn" | "info" | "ok" }[] = [];
  if (summary) {
    if (summary.late_min > 0) flags.push({ label: `${summary.late_min}m late`, tone: "warn" });
    if (summary.undertime_min > 0) flags.push({ label: `${summary.undertime_min}m undertime`, tone: "warn" });
    if (summary.ot_min > 0) flags.push({ label: `${hrs(summary.ot_min)} OT`, tone: "ok" });
    if (summary.ot_pending_min > 0) flags.push({ label: `${hrs(summary.ot_pending_min)} OT (file it)`, tone: "info" });
    if (summary.restday_min > 0) flags.push({ label: `${hrs(summary.restday_min)} rest-day`, tone: "ok" });
    if (summary.nightdiff_min > 0) flags.push({ label: `${hrs(summary.nightdiff_min)} night diff`, tone: "info" });
  }

  return (
    <main className="min-h-dvh bg-surface-2">
      {/* Header */}
      <header className="bg-brand-deep px-5 pb-6 pt-7 text-white">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/app_icon.png" alt="" width={40} height={40} className="h-10 w-10 rounded-xl ring-1 ring-white/15" />
            <div>
              <p className="text-[12px] text-brand-soft">Hi, {first} 👋</p>
              <p className="text-[15px] font-bold">Staff Portal</p>
            </div>
          </div>
          <form action={portalSignOut}>
            <button className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold">
              <LogOut size={13} /> Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto -mt-3 max-w-md space-y-4 px-4 pb-12">
        {/* Clock card */}
        <div className="rounded-3xl border border-hairline bg-surface-1 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">Today</p>
              <p className="text-[15px] font-bold text-ink">
                {open ? "Clocked in" : summary?.last_out != null ? "Clocked out" : "Not clocked in"}
              </p>
            </div>
            {summary && (summary.first_in != null) && (
              <div className="text-right text-[12px] text-ink-muted">
                <p>In {minToTime(summary.first_in)}</p>
                {summary.last_out != null && <p>Out {minToTime(summary.last_out)}</p>}
                {summary.worked_min > 0 && <p className="font-bold text-ink">{hrs(summary.worked_min)}</p>}
              </div>
            )}
          </div>

          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {flags.map((f, i) => (
                <span key={i}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    f.tone === "warn" ? "bg-red-50 text-red-600"
                    : f.tone === "ok" ? "bg-green-50 text-green-700"
                    : "bg-brand-tint text-brand-deep"}`}>
                  {f.label}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowSelfie(true)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white shadow-card transition ${
              open ? "bg-brand-deep hover:bg-ink" : "bg-green-600 hover:bg-green-700"}`}>
            <Camera size={18} /> Clock {open ? "out" : "in"}
          </button>
          {me.geofenced && (
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-ink-subtle">
              <MapPin size={11} /> {coords ? "Location ready" : "Getting location…"} · selfie required
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <ActionBtn icon={Plane} label="Leave" onClick={() => setFileKind("leave")} />
          <ActionBtn icon={Clock3} label="Overtime" onClick={() => setFileKind("ot")} />
          <ActionBtn icon={TimerOff} label="Undertime" onClick={() => setFileKind("undertime")} />
        </div>

        {/* Schedule */}
        <Section title="My schedule" icon={CalendarDays}>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const s = me.schedule?.find((x) => x.weekday === d);
              return (
                <div key={d} className={`rounded-lg py-2 text-center ${s ? "bg-brand-tint" : "bg-surface-2"}`}>
                  <p className="text-[10px] font-bold text-ink-muted">{WD[d]}</p>
                  <p className={`text-[9px] ${s ? "text-brand-deep" : "text-ink-subtle"}`}>
                    {s ? s.start : "off"}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Requests */}
        <Section title="My requests" icon={CalendarDays}>
          {requests.length === 0 ? (
            <p className="text-[13px] text-ink-subtle">Nothing filed yet.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold capitalize text-ink">
                      {r.kind === "leave" ? (r.leave_type_name ?? "Leave") : r.kind === "ot" ? "Overtime" : "Undertime"}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {r.start_date}{r.end_date && r.end_date !== r.start_date ? ` → ${r.end_date}` : ""}
                      {r.hours ? ` · ${r.hours}h` : ""}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {showSelfie && (
        <SelfieModal
          kind={open ? "out" : "in"}
          busy={busy}
          onCancel={() => setShowSelfie(false)}
          onConfirm={doPunch}
        />
      )}
      {fileKind && (
        <RequestModal
          kind={fileKind}
          leaveTypes={leaveTypes}
          today={today}
          onClose={() => setFileKind(null)}
          onFiled={(msg) => { setFileKind(null); setToast(msg); router.refresh(); }}
        />
      )}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </main>
  );
}

function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Plane; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-hairline bg-surface-1 py-3.5 shadow-card transition hover:border-brand-soft">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-tint text-brand-deep"><Icon size={17} /></span>
      <span className="text-[12px] font-bold text-ink">{label}</span>
    </button>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof CalendarDays; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-1 p-5 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-deep">
        <Icon size={15} /> {title}
      </h2>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
  };
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${m[status] ?? ""}`}>{status}</span>;
}

function SelfieModal({ kind, busy, onCancel, onConfirm }: {
  kind: "in" | "out"; busy: boolean; onCancel: () => void; onConfirm: (selfie: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selfie) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: 480, height: 640 } })
        .then((s) => {
          if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = s;
          if (videoRef.current) { videoRef.current.srcObject = s; void videoRef.current.play(); }
        })
        .catch(() => setCamErr("Allow camera access to clock in."));
    }
    return () => { cancelled = true; stop(); };
  }, [selfie, stop]);

  function capture() {
    const v = videoRef.current; if (!v) return;
    const w = 360, h = Math.round(w * ((v.videoHeight || 640) / (v.videoWidth || 480)));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d")?.drawImage(v, 0, 0, w, h);
    setSelfie(c.toDataURL("image/jpeg", 0.6)); stop();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl bg-surface-1 p-5" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-center text-sm font-bold text-ink">Clock {kind === "in" ? "IN" : "OUT"} — quick selfie</p>
        <div className="mx-auto aspect-[3/4] w-52 overflow-hidden rounded-2xl bg-ink/90">
          {selfie
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={selfie} alt="" className="h-full w-full object-cover" />
            : <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />}
        </div>
        {camErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] font-semibold text-red-600">{camErr}</p>}
        <div className="mt-4 space-y-2">
          {!selfie ? (
            <button onClick={capture} disabled={!!camErr}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50">
              <Camera size={17} /> Take selfie
            </button>
          ) : (
            <>
              <button onClick={() => onConfirm(selfie)} disabled={busy}
                className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60 ${kind === "in" ? "bg-green-600" : "bg-brand-deep"}`}>
                {busy ? <Loader2 size={17} className="animate-spin" /> : <>Clock {kind === "in" ? "IN" : "OUT"} now</>}
              </button>
              <button onClick={() => setSelfie(null)} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 px-6 py-2.5 text-[13px] font-semibold text-ink-muted">
                <RefreshCw size={14} /> Retake
              </button>
            </>
          )}
          <button onClick={onCancel} className="w-full py-1 text-center text-[13px] font-medium text-ink-muted">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function RequestModal({ kind, leaveTypes, today, onClose, onFiled }: {
  kind: "leave" | "ot" | "undertime"; leaveTypes: LeaveType[]; today: string;
  onClose: () => void; onFiled: (msg: string) => void;
}) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [leaveType, setLeaveType] = useState(leaveTypes[0]?.id ?? "");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titles = { leave: "File Leave", ot: "File Overtime", undertime: "File Undertime" };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fileRequest({
      kind, start,
      end: kind === "leave" ? end : start,
      leaveType: kind === "leave" ? (leaveType || null) : null,
      hours: kind === "ot" ? parseFloat(hours || "0") : null,
      reason,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "Could not file."); return; }
    onFiled(`${titles[kind]} submitted`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-3xl bg-surface-1 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">{titles[kind]}</h2>
          <button type="button" onClick={onClose} className="text-ink-muted"><X size={18} /></button>
        </div>

        {kind === "leave" && (
          <>
            <Field label="Type">
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand">
                {leaveTypes.length === 0 && <option value="">General leave</option>}
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.emoji ? lt.emoji + " " : ""}{lt.name}{lt.paid ? " (paid)" : ""}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From"><DateInput value={start} onChange={setStart} /></Field>
              <Field label="To"><DateInput value={end} onChange={setEnd} /></Field>
            </div>
          </>
        )}
        {kind !== "leave" && <Field label="Date"><DateInput value={start} onChange={setStart} /></Field>}
        {kind === "ot" && (
          <Field label="Hours">
            <input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ""))} placeholder="e.g. 2"
              className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
          </Field>
        )}
        <Field label="Reason">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Short reason…"
            className="w-full resize-none rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
        </Field>
        {error && <p className="text-[13px] font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={busy}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-card disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Submit request"}
        </button>
      </form>
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand" />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-card">
        <Check size={15} className="text-green-400" /> {text}
      </div>
    </div>
  );
}
