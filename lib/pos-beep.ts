/**
 * Short synthetic scanner-style beeps via Web Audio (no asset files).
 * Browsers may require a user gesture before the first sound.
 */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const legacy = (
    window as unknown as { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;
  const Ctx = window.AudioContext ?? legacy;
  if (!Ctx) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

function beepTone(
  ctx: AudioContext,
  frequency: number,
  durationSec: number,
  volume: number,
  type: OscillatorType = "square",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, volume),
    ctx.currentTime + 0.008,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + durationSec,
  );
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + durationSec + 0.02);
}

function bellTone(
  ctx: AudioContext,
  frequency: number,
  t0: number,
  durationSec: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0002, volume),
    t0 + 0.012,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.03);
}

/** Kitchen line: urgent descending chime for a new incoming ticket */
export function playKitchenIncomingTicket() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => {});
  const t0 = ctx.currentTime;
  bellTone(ctx, 987.77, t0, 0.18, 0.092);
  bellTone(ctx, 783.99, t0 + 0.22, 0.2, 0.082);
  bellTone(ctx, 659.25, t0 + 0.48, 0.42, 0.075);
}

/** Soft multi-tone chime when a guest places an order from the QR menu */
export function playQrOrderNotify() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => {});
  const t0 = ctx.currentTime;
  bellTone(ctx, 523.25, t0, 0.22, 0.085);
  bellTone(ctx, 659.25, t0 + 0.26, 0.32, 0.075);
  bellTone(ctx, 783.99, t0 + 0.62, 0.4, 0.06);
}

export type PosBeepKind = "scan" | "tick" | "remove" | "newOrder";

export function playPosBeep(kind: PosBeepKind = "scan") {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().catch(() => {});

  switch (kind) {
    case "scan":
      beepTone(ctx, 1850, 0.045, 0.065, "square");
      break;
    case "tick":
      beepTone(ctx, 720, 0.035, 0.05, "sine");
      break;
    case "remove":
      beepTone(ctx, 380, 0.09, 0.055, "triangle");
      break;
    case "newOrder":
      beepTone(ctx, 660, 0.05, 0.055, "square");
      window.setTimeout(() => {
        void ctx.resume().catch(() => {});
        beepTone(ctx, 880, 0.06, 0.05, "square");
      }, 70);
      break;
    default:
      break;
  }
}
