"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Camera, RefreshCw, MapPin, Check } from "lucide-react";
import { getRoster, submitPunch, type Roster } from "./actions";

type Step = "loading" | "who" | "selfie" | "done" | "notfound";

export default function AttendPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-surface-2" />}>
      <Attend />
    </Suspense>
  );
}

function Attend() {
  const params = useSearchParams();
  const code = (params.get("s") ?? "").toUpperCase();

  const [step, setStep] = useState<Step>("loading");
  const [roster, setRoster] = useState<Roster | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<"in" | "out">("in");
  const [empId, setEmpId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsState, setGpsState] = useState<"idle" | "ok" | "denied">("idle");
  const [busy, setBusy] = useState(false);
  const [doneInfo, setDoneInfo] = useState<{ name: string; kind: string; at: string } | null>(null);

  // Load the store roster.
  useEffect(() => {
    if (!code) {
      setStep("notfound");
      return;
    }
    getRoster(code).then((r) => {
      if (!r.ok || !r.roster) {
        setStep("notfound");
        return;
      }
      setRoster(r.roster);
      setStep("who");
    });
  }, [code]);

  // Grab GPS early so it's ready by submit.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGpsState("ok");
      },
      () => setGpsState("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const empName = roster?.employees.find((e) => e.id === empId)?.name ?? "";

  async function doSubmit() {
    if (!selfie || !empId) return;
    setBusy(true);
    setError(null);
    const res = await submitPunch({
      code,
      employeeId: empId,
      pin,
      kind,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      selfie,
      device: navigator.userAgent.slice(0, 120),
    });
    setBusy(false);
    if (!res.ok || !res.result) {
      setError(res.error ?? "Could not record.");
      return;
    }
    setDoneInfo({ name: res.result.employee_name, kind: res.result.kind, at: res.result.at });
    setStep("done");
  }

  function reset() {
    setEmpId(null);
    setPin("");
    setSelfie(null);
    setError(null);
    setDoneInfo(null);
    setStep("who");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-deep px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <Image
            src="/app_icon.png"
            alt="Prestige POS"
            width={52}
            height={52}
            priority
            className="h-[52px] w-[52px] rounded-2xl shadow-card ring-1 ring-white/15"
          />
          <h1 className="mt-3 text-xl font-bold tracking-tight text-white">
            {roster?.business_name ?? "Time Clock"}
          </h1>
          <p className="text-[12px] text-brand-soft">Staff time clock</p>
        </div>

        <div className="rounded-3xl bg-surface-1 p-5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
          {step === "loading" && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-brand" />
            </div>
          )}

          {step === "notfound" && (
            <div className="py-8 text-center">
              <h2 className="text-lg font-bold text-ink">Store not found</h2>
              <p className="mt-2 text-sm text-ink-muted">
                Scan the QR code at your store, or ask your manager for the link.
              </p>
            </div>
          )}

          {step === "who" && roster && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["in", "out"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`rounded-xl py-3 text-sm font-bold uppercase tracking-wide transition ${
                      kind === k
                        ? k === "in"
                          ? "bg-green-600 text-white shadow-card"
                          : "bg-brand-deep text-white shadow-card"
                        : "bg-surface-2 text-ink-muted"
                    }`}
                  >
                    Clock {k}
                  </button>
                ))}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Who are you?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roster.employees.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEmpId(e.id)}
                      className={`truncate rounded-xl border-2 px-3 py-2.5 text-[13px] font-semibold transition ${
                        empId === e.id
                          ? "border-brand bg-brand-tint/50 text-ink"
                          : "border-hairline bg-surface-1 text-ink-muted"
                      }`}
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
                {roster.employees.length === 0 && (
                  <p className="text-[13px] text-ink-subtle">No staff added yet.</p>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Your PIN
                </p>
                <input
                  inputMode="numeric"
                  type="password"
                  value={pin}
                  maxLength={6}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border-2 border-hairline bg-surface-2 px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink outline-none focus:border-brand"
                />
              </div>

              <GpsHint state={gpsState} geofenced={roster.geofenced} />
              {error && <ErrorLine text={error} />}

              <button
                disabled={!empId || pin.length < 3}
                onClick={() => {
                  setError(null);
                  setStep("selfie");
                }}
                className="w-full rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-deep disabled:opacity-50"
              >
                Next — take a selfie
              </button>
            </div>
          )}

          {step === "selfie" && (
            <SelfieStep
              kind={kind}
              name={empName}
              selfie={selfie}
              setSelfie={setSelfie}
              busy={busy}
              error={error}
              onBack={() => {
                setSelfie(null);
                setError(null);
                setStep("who");
              }}
              onSubmit={doSubmit}
            />
          )}

          {step === "done" && doneInfo && (
            <div className="flex flex-col items-center py-4 text-center">
              <span
                className={`grid h-16 w-16 place-items-center rounded-full text-white ${
                  doneInfo.kind === "in" ? "bg-green-600" : "bg-brand-deep"
                }`}
              >
                <Check size={34} />
              </span>
              <h2 className="mt-4 text-xl font-bold text-ink">
                Clocked {doneInfo.kind === "in" ? "in" : "out"}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                <b className="text-ink">{doneInfo.name}</b> · {doneInfo.at}
              </p>
              <button
                onClick={reset}
                className="mt-6 w-full rounded-full bg-surface-2 px-6 py-3 text-sm font-semibold text-ink"
              >
                Done
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-brand-soft/70">
          Prestige POS · Verified time clock
        </p>
      </div>
    </main>
  );
}

function SelfieStep({
  kind,
  name,
  selfie,
  setSelfie,
  busy,
  error,
  onBack,
  onSubmit,
}: {
  kind: "in" | "out";
  name: string;
  selfie: string | null;
  setSelfie: (s: string | null) => void;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selfie) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user", width: 480, height: 640 } })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play();
          }
        })
        .catch(() => setCamErr("Camera blocked. Allow camera access to clock in."));
    }
    return () => {
      cancelled = true;
      stop();
    };
  }, [selfie, stop]);

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const w = 360;
    const h = Math.round(w * ((v.videoHeight || 640) / (v.videoWidth || 480)));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(v, 0, 0, w, h);
    setSelfie(canvas.toDataURL("image/jpeg", 0.6));
    stop();
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-semibold text-ink">
        {name} · clocking {kind === "in" ? "IN" : "OUT"}
      </p>

      <div className="mx-auto aspect-[3/4] w-56 overflow-hidden rounded-2xl bg-ink/90">
        {selfie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selfie} alt="selfie" className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
        )}
      </div>

      {camErr && <ErrorLine text={camErr} />}
      {error && <ErrorLine text={error} />}

      {!selfie ? (
        <button
          onClick={capture}
          disabled={!!camErr}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-card disabled:opacity-50"
        >
          <Camera size={17} /> Take selfie
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={onSubmit}
            disabled={busy}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-card disabled:opacity-60 ${
              kind === "in" ? "bg-green-600 hover:bg-green-700" : "bg-brand-deep hover:bg-ink"
            }`}
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <>Clock {kind === "in" ? "IN" : "OUT"} now</>}
          </button>
          <button
            onClick={() => setSelfie(null)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 px-6 py-2.5 text-[13px] font-semibold text-ink-muted"
          >
            <RefreshCw size={14} /> Retake
          </button>
        </div>
      )}

      <button onClick={onBack} className="w-full text-center text-[13px] font-medium text-ink-muted">
        Back
      </button>
    </div>
  );
}

function GpsHint({ state, geofenced }: { state: "idle" | "ok" | "denied"; geofenced: boolean }) {
  if (!geofenced) return null;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium ${
        state === "ok"
          ? "bg-green-50 text-green-700"
          : state === "denied"
            ? "bg-red-50 text-red-600"
            : "bg-surface-2 text-ink-muted"
      }`}
    >
      <MapPin size={14} />
      {state === "ok"
        ? "Location confirmed"
        : state === "denied"
          ? "Turn on location — required at this store"
          : "Getting your location…"}
    </div>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] font-semibold text-red-600">
      {text}
    </p>
  );
}
