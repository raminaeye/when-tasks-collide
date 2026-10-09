import { useEffect, useMemo, useRef, useState } from "react";

// The exact two-task toy landscape from the CAGrad paper, as given in §5.1.
type V = [number, number];
const EPS = 1e-4;

function f1(t: V) { return Math.log(Math.max(Math.abs(0.5 * (-t[0] - 7) - Math.tanh(-t[1])), 5e-6)) + 6; }
function f2(t: V) { return Math.log(Math.max(Math.abs(0.5 * (-t[0] + 3) + Math.tanh(-t[1]) + 2), 5e-6)) + 6; }
function g1(t: V) { return ((-t[0] + 7) ** 2 + 0.1 * (-t[1] - 8) ** 2) / 10 - 20; }
function g2(t: V) { return ((-t[0] - 7) ** 2 + 0.1 * (-t[1] - 8) ** 2) / 10 - 20; }
function losses(t: V): [number, number] {
  const c1 = Math.max(Math.tanh(0.5 * t[1]), 0);
  const c2 = Math.max(Math.tanh(-0.5 * t[1]), 0);
  return [c1 * f1(t) + c2 * g1(t), c1 * f2(t) + c2 * g2(t)];
}
function grad(fn: (t: V) => number, t: V): V {
  return [
    (fn([t[0] + EPS, t[1]]) - fn([t[0] - EPS, t[1]])) / (2 * EPS),
    (fn([t[0], t[1] + EPS]) - fn([t[0], t[1] - EPS])) / (2 * EPS),
  ];
}
function grads(t: V): [V, V] {
  const l1 = (u: V) => { const c = losses(u); return c[0]; };
  const l2 = (u: V) => { const c = losses(u); return c[1]; };
  return [grad(l1, t), grad(l2, t)];
}

const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
const nrm = (a: V) => Math.hypot(a[0], a[1]);

function pcgradStep(a: V, b: V): V {
  let x: V = [...a], y: V = [...b];
  if (dot(x, y) < 0) {
    x = [x[0] - (dot(x, y) / dot(y, y)) * y[0], x[1] - (dot(x, y) / dot(y, y)) * y[1]];
    y = [y[0] - (dot(y, a) / dot(a, a)) * a[0], y[1] - (dot(y, a) / dot(a, a)) * a[1]];
  }
  return [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2];
}
function mgdaStep(a: V, b: V): V {
  const d: V = [a[0] - b[0], a[1] - b[1]];
  const e: V = [b[0] - a[0], b[1] - a[1]]; // b - a: min-norm weight is <b, b-a> / ||a-b||^2
  const denom = dot(d, d);
  let w = denom < 1e-12 ? 0.5 : dot(b, e) / denom;
  w = Math.min(1, Math.max(0, w));
  return [(w * a[0] + (1 - w) * b[0]) / 2, (w * a[1] + (1 - w) * b[1]) / 2];
}
function cagradStep(a: V, b: V, c: number): V {
  const g0: V = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n0 = nrm(g0);
  if (n0 < 1e-12) return g0;
  let bestW = 0.5, bestF = Infinity;
  for (let i = 0; i <= 200; i++) {
    const w = i / 200;
    const gw: V = [w * a[0] + (1 - w) * b[0], w * a[1] + (1 - w) * b[1]];
    const F = dot(gw, g0) + c * n0 * nrm(gw);
    if (F < bestF) { bestF = F; bestW = w; }
  }
  const gw: V = [bestW * a[0] + (1 - bestW) * b[0], bestW * a[1] + (1 - bestW) * b[1]];
  const ng = nrm(gw);
  if (ng < 1e-12) return g0;
  const raw: V = [g0[0] + (c * n0 * gw[0]) / ng, g0[1] + (c * n0 * gw[1]) / ng];
  return [raw[0] / (1 + c), raw[1] / (1 + c)]; // official 1/(1+c) normalization
}

type MethodKey = "gd" | "mgda" | "pcgrad" | "cagrad";
const METHODS: { key: MethodKey; label: string; color: string }[] = [
  { key: "gd", label: "GD (plain average)", color: "#f0927e" },
  { key: "mgda", label: "MGDA", color: "#e9b949" },
  { key: "pcgrad", label: "PCGrad", color: "#aaf7b3" },
  { key: "cagrad", label: "CAGrad c=0.5", color: "#8ab2d1" },
];
const STARTS: V[] = [[-8.5, 7.5], [-8.5, 5], [0, 0], [9, 9], [10, -8]];
const STEPS = 20000;

type Run = { path: V[]; confFrac: number; lossHist: { i: number; L: number }[]; confSeries: number[] };

function runTrajectory(method: MethodKey, start: V, c = 0.5, steps = STEPS): Run {
  let t: V = [...start];
  const path: V[] = [t];
  const lossHist: { i: number; L: number }[] = [];
  const confSeries: number[] = [];
  let conflicts = 0;
  let m: V = [0, 0], v: V = [0, 0];
  const b1 = 0.9, b2 = 0.999, lr = 2e-3;
  for (let i = 1; i <= steps; i++) {
    const [a, b] = grads(t);
    if (dot(a, b) < 0) { conflicts++; confSeries.push(1); } else confSeries.push(0);
    let d: V;
    if (method === "gd") d = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    else if (method === "pcgrad") d = pcgradStep(a, b);
    else if (method === "mgda") d = mgdaStep(a, b);
    else d = cagradStep(a, b, c);
    // Adam on -d (we descend, so feed gradient d which is the uphill-combined direction)
    m = [b1 * m[0] + (1 - b1) * d[0], b1 * m[1] + (1 - b1) * d[1]];
    v = [b2 * v[0] + (1 - b2) * d[0] * d[0], b2 * v[1] + (1 - b2) * d[1] * d[1]];
    const mh = [m[0] / (1 - b1 ** i), m[1] / (1 - b1 ** i)];
    const vh = [v[0] / (1 - b2 ** i), v[1] / (1 - b2 ** i)];
    t = [
      t[0] - (lr * mh[0]) / (Math.sqrt(vh[0]) + 1e-8),
      t[1] - (lr * mh[1]) / (Math.sqrt(vh[1]) + 1e-8),
    ];
    if (i % 16 === 0) path.push([...t]);
    if (i % 100 === 0) { const [l1, l2] = losses(t); lossHist.push({ i, L: (l1 + l2) / 2 }); }
  }
  path.push([...t]);
  return { path, confFrac: conflicts / steps, lossHist, confSeries };
}

// ---- Figure 9b: average loss over time, GD vs CAGrad ----
function LossCurves({ runs }: { runs: Record<MethodKey, Run> }) {
  const W = 560, H = 210, P = 34;
  const all = METHODS.flatMap((m) => runs[m.key].lossHist);
  const mn = Math.min(...all.map((p) => p.L));
  const mx = Math.max(...all.map((p) => p.L));
  const X = (i: number) => P + ((W - P - 10) * i) / STEPS;
  const Y = (L: number) => H - P - ((H - P - 12) * (L - mn)) / (mx - mn || 1);
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>Figure 9b · average loss vs step</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const L = mn + t * (mx - mn);
          return (
            <g key={t}>
              <line x1={P} y1={Y(L)} x2={W - 10} y2={Y(L)} stroke="rgba(203,198,185,.1)" />
              <text x={P - 5} y={Y(L) + 3} textAnchor="end" fontSize={9} fill="rgba(203,198,185,.5)" className="mono">{L.toFixed(0)}</text>
            </g>
          );
        })}
        {METHODS.map((m) => (
          <polyline
            key={m.key}
            points={runs[m.key].lossHist.map((p) => `${X(p.i)},${Y(p.L)}`).join(" ")}
            fill="none"
            stroke={m.color}
            strokeWidth={m.key === "gd" || m.key === "cagrad" ? 2.6 : 1.4}
            strokeOpacity={m.key === "gd" || m.key === "cagrad" ? 1 : 0.6}
          />
        ))}
        <text x={X(STEPS * 0.45)} y={H - 12} fontSize={10} fill="rgba(203,198,185,.55)">training step → (×20,000)</text>
        {METHODS.map((m, i) => (
          <text key={m.key} x={W - 150} y={24 + i * 14} fontSize={10} fill={m.color}>{m.label}</text>
        ))}
      </svg>
      <div className="small dim">GD stalls high (stuck in the ravine). CAGrad keeps going down. Same landscape, same start — only the update rule differs.</div>
    </div>
  );
}

// ---- Figure 11: the walk, redrawn in loss space ----
function LossSpace({ runs, cagradC, c, setC }: { runs: Record<MethodKey, Run>; cagradC: Run; c: number; setC: (v: number) => void }) {
  const W = 560, H = 280, P = 40;
  const front: [number, number][] = [];
  for (let x = -7; x <= 7; x += 0.05) {
    const [l1, l2] = losses([x, -8.3552]);
    front.push([l1, l2]);
  }
  const pts = METHODS.map((m) => { const end = runs[m.key].path[runs[m.key].path.length - 1]; return { m, p: losses(end) }; });
  const cEnd = cagradC.path[cagradC.path.length - 1];
  const cLoss = losses(cEnd);
  const xs = [...front.map((f) => f[0]), ...pts.map((q) => q.p[0]), cLoss[0]];
  const ys = [...front.map((f) => f[1]), ...pts.map((q) => q.p[1]), cLoss[1]];
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const X = (v: number) => P + ((W - P - 14) * (v - x0)) / (x1 - x0 || 1);
  const Y = (v: number) => H - P - ((H - P - 14) * (v - y0)) / (y1 - y0 || 1);
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>Figure 11 · where each method lands in loss space</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
        <polyline points={front.map((f) => `${X(f[0])},${Y(f[1])}`).join(" ")} fill="none" stroke="rgba(233,231,226,.55)" strokeWidth={2.5} strokeLinecap="round" />
        <text x={X((x0 + x1) / 2)} y={H - 12} textAnchor="middle" fontSize={10} fill="rgba(203,198,185,.55)">task 1 loss →</text>
        <text x={12} y={Y((y0 + y1) / 2)} fontSize={10} fill="rgba(203,198,185,.55)" transform={`rotate(-90 12 ${Y((y0 + y1) / 2)})`} textAnchor="middle">task 2 loss →</text>
        <text x={X(front[Math.floor(front.length * 0.75)][0]) - 118} y={Y(front[Math.floor(front.length * 0.75)][1]) + 3} fontSize={10} fill="rgba(233,231,226,.7)">Pareto front —</text>
        {pts.map((q) => (
          <g key={q.m.key}>
            <circle cx={X(q.p[0])} cy={Y(q.p[1])} r={5.5} fill={q.m.color} />
            <text x={X(q.p[0]) + 9} y={Y(q.p[1]) - 7} fontSize={10} fill={q.m.color}>{q.m.label.split(" ")[0]}</text>
          </g>
        ))}
        <circle cx={X(cLoss[0])} cy={Y(cLoss[1])} r={7} fill="none" stroke="#e9b949" strokeWidth={2} />
        <text x={X(cLoss[0]) + 11} y={Y(cLoss[1]) + 20} fontSize={10} fill="#e9b949">CAGrad c={c.toFixed(2)}</text>
      </svg>
      <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
        <span className="small dim" style={{ minWidth: 150 }}>c slider: how much CAGrad may stray</span>
        <input type="range" min={0} max={0.99} step={0.01} value={c} onChange={(e) => setC(parseFloat(e.target.value))} style={{ flex: 1 }} />
      </div>
      <div className="small dim" style={{ marginTop: 6 }}>
        The gold ring is a fresh CAGrad run at <em>your</em> c (shorter run). Small c hugs the average and can stall; large c runs free toward the front. Every endpoint sits on or behind the gray Pareto curve — nobody can land "below" it, by definition.
      </div>
    </div>
  );
}

// ---- Figure 8, as the paper draws it: 2 rows × 4 methods, contour-map style ----
// Contour-line background (hiking-map look) cached once.
function makeContourBg(): HTMLCanvasElement {
  const W = 300, H = 300;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#0a0503";
  ctx.fillRect(0, 0, W, H);
  // band boundaries: for each of N contour levels, mark pixels near a level crossing
  const levels: number[] = [];
  let mn = Infinity, mx = -Infinity;
  const grid: number[] = [];
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const x = -10 + (20 * i) / (W - 1);
      const y = 10 - (20 * j) / (H - 1);
      const [l1, l2] = losses([x, y]);
      const L = (l1 + l2) / 2;
      grid.push(L);
      if (L < mn) mn = L;
      if (L > mx) mx = L;
    }
  const N = 16;
  for (let k = 1; k < N; k++) levels.push(mn + ((mx - mn) * k) / N);
  const img = ctx.createImageData(W, H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const v = grid[j * W + i];
      const vr = j + 1 < H ? grid[(j + 1) * W + i] : v;
      const vd = i + 1 < W ? grid[j * W + i + 1] : v;
      let onLine = false;
      for (const lv of levels)
        if ((v - lv) * (vr - lv) < 0 || (v - lv) * (vd - lv) < 0) { onLine = true; break; }
      // faint terrain tint + darker where steep
      const t = (v - mn) / (mx - mn || 1);
      let r = 10 + t * 26, g = 6 + t * 20, b = 4 + t * 16, a = 255;
      if (onLine) { r = 150; g = 138; b = 116; a = 150; }
      const o = (j * W + i) * 4;
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = a;
    }
  ctx.putImageData(img, 0, 0);
  return cv;
}

function FigMap({ bg, runs, label }: { bg: HTMLCanvasElement; runs: { run: Run; start: V }[]; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const size = 300;
    cv.width = size; cv.height = size;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(bg, 0, 0, size, size);
    const px = (t: V): [number, number] => [((t[0] + 10) / 20) * size, ((10 - t[1]) / 20) * size];
    // Pareto bar + star (horizontal: theta2 = -8.3552, theta1 in [-7,7])
    const [a, b] = px([-7, -8.3552]);
    const [c2, d2] = px([7, -8.3552]);
    ctx.strokeStyle = "rgba(233,231,226,.45)"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d2); ctx.stroke();
    const [sx2, sy2] = px([0, -8.3552]);
    ctx.fillStyle = "#e9e7e2"; ctx.font = "13px sans-serif"; ctx.fillText("★", sx2 - 6, sy2 + 4);
    // trails: yellow → orange with time, red endpoint dot (paper's style)
    for (const { run, start } of runs) {
      const n = run.path.length;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        ctx.strokeStyle = `rgba(233,${Math.round(205 - 80 * t)},${Math.round(73 - 30 * t)},.9)`;
        ctx.lineWidth = 1.6;
        const [x1, y1] = px(run.path[i - 1]);
        const [x2, y2] = px(run.path[i]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      const [ex, ey] = px(run.path[n - 1]);
      ctx.fillStyle = "#f0927e"; ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, 7); ctx.fill();
      const [sx, sy] = px(start);
      ctx.fillStyle = "#e9e7e2"; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 7); ctx.fill();
    }
  }, [bg, runs]);
  return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(203,198,185,.1)" }}>
      <canvas ref={ref} style={{ width: "100%", display: "block" }} />
      <span className="mono" style={{ position: "absolute", top: 5, left: 7, fontSize: 10, color: "var(--lighter)", background: "rgba(5,1,0,.55)", padding: "1px 6px", borderRadius: 5 }}>
        {label}
      </span>
    </div>
  );
}

function Figure8Grid() {
  const bg = useMemo(() => makeContourBg(), []);
  const RACE_START: V = [-8.5, 5];
  const top = useMemo(() => METHODS.map((m) => ({ m, run: runTrajectory(m.key, RACE_START, 0.5, 5000) })), []);
  const bottom = useMemo(
    () => METHODS.map((m) => ({ m, runs: STARTS.map((s) => ({ run: runTrajectory(m.key, s, 0.5, 5000), start: s })) })),
    []
  );
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>Figure 8 · four methods walk the same map</div>
      <div className="small dim" style={{ margin: "2px 0 8px" }}>
        Top row: the fair race — one start (−8.5, 5), four methods. Bottom row: same method, the paper's five starts.
        Trails run yellow → orange with time and end at the red dot; the gray bar is the Pareto set, ★ its best point.
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {top.map(({ m, run }) => <FigMap key={m.key} bg={bg} runs={[{ run, start: RACE_START }]} label={m.label} />)}
        {bottom.map(({ m, runs }) => <FigMap key={m.key} bg={bg} runs={runs} label={`${m.label} · 5 starts`} />)}
      </div>
      <div className="small dim" style={{ marginTop: 8 }}>
        <strong style={{ color: "var(--lighter)" }}>Try this:</strong> read the top row left to right, then compare columns top vs bottom.
        You should see GD's trail die in the ravine from three of five starts, MGDA/PCGrad land scattered along the
        gray bar, and CAGrad's trails all bend toward the ★. <strong style={{ color: "var(--lighter)" }}>Takeaway:</strong> the outcome depends on the
        update rule, not the start — the landscape fights everyone, but only GD has no answer to it.
      </div>
    </div>
  );
}

// ---- Figure 9a: conflict never goes away under GD (chunked histogram) ----
function ConflictChunks({ run }: { run: Run }) {
  const chunks: number[] = [];
  for (let c = 0; c < 10; c++) {
    const a = Math.floor((run.confSeries.length * c) / 10);
    const b = Math.floor((run.confSeries.length * (c + 1)) / 10);
    let s = 0;
    for (let i = a; i < b; i++) s += run.confSeries[i];
    chunks.push(s / Math.max(1, b - a));
  }
  const W = 560, H = 150, P = 34, bw = (W - P - 12) / 10;
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>Figure 9a · conflict never goes away under GD</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={P} x2={W - 12} y1={H - 22 - f * (H - 40)} y2={H - 22 - f * (H - 40)} stroke="rgba(203,198,185,.1)" />
            <text x={P - 5} y={H - 19 - f * (H - 40)} textAnchor="end" fontSize={9} fill="rgba(203,198,185,.5)" className="mono">{(f * 100).toFixed(0)}%</text>
          </g>
        ))}
        {chunks.map((v, i) => (
          <rect key={i} x={P + i * bw + 3} y={H - 22 - v * (H - 40)} width={bw - 6} height={v * (H - 40)} fill="#f0927e" rx={2} />
        ))}
        <text x={P + 4} y={14} fontSize={10} fill="#f0927e">
          once GD reaches the ravine, {(chunks[9] * 100).toFixed(0)}% of steps have the two tasks fighting — it never resolves itself
        </text>
        <text x={P} y={H - 6} fontSize={9} fill="rgba(203,198,185,.5)">training progress → (10 chunks of the full run)</text>
      </svg>
      <div className="small dim">
        GD's run is chopped
        into ten chunks; each bar counts how often g₁·g₂ &lt; 0 inside it. The conflict is the climate of the trap,
        not a passing storm.
      </div>
    </div>
  );
}

export default function LandscapeRacer() {
  const [start, setStart] = useState<V>([-8.5, 5]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [c, setC] = useState(0.5);

  // Precompute runs once per start (CAGrad at c=0.5 for the race)
  const runs = useMemo(() => {
    const out = {} as Record<MethodKey, Run>;
    for (const m of METHODS) out[m.key] = runTrajectory(m.key, start);
    return out;
  }, [start]);
  const trails = useMemo(() => {
    const out = {} as Record<MethodKey, V[]>;
    for (const m of METHODS) out[m.key] = runs[m.key].path;
    return out;
  }, [runs]);

  // CAGrad with the c slider (Fig 11), lighter run
  const cagradC = useMemo(() => runTrajectory("cagrad", start, c, 12000), [start, c]);

  // Background loss map
  const bg = useMemo(() => {
    const W = 220, H = 220;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    const vals: number[] = [];
    let mn = Infinity, mx = -Infinity;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const x = -10 + (20 * i) / (W - 1);
        const y = 10 - (20 * j) / (H - 1);
        const [l1, l2] = losses([x, y]);
        const L = (l1 + l2) / 2;
        vals.push(L);
        if (L < mn) mn = L;
        if (L > mx) mx = L;
      }
    }
    for (let k = 0; k < vals.length; k++) {
      const t = (vals[k] - mn) / (mx - mn || 1);
      // dark terrain: low = warm dark, high = lighter warm gray; quantize for contour bands
      const band = Math.floor(t * 14) / 14 + t * 0.06;
      const r = 8 + band * 70;
      const g = 4 + band * 60;
      const b = 2 + band * 48;
      img.data[k * 4] = r;
      img.data[k * 4 + 1] = g;
      img.data[k * 4 + 2] = b;
      img.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }, []);

  useEffect(() => {
    const cv = canvasRef.current!;
    const size = 500;
    cv.width = size; cv.height = size;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bg, 0, 0, size, size);
    const px = (t: V): [number, number] => [((t[0] + 10) / 20) * size, ((10 - t[1]) / 20) * size];

    // Pareto set bar: theta2 = -8.3552, theta1 in [-7,7]
    const [px1, py1] = px([-7, -8.3552]);
    const [px2, py2] = px([7, -8.3552]);
    ctx.strokeStyle = "rgba(233,231,226,.55)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
    // star: min average loss on the bar
    let best: V = [0, -8.3552], bestL = Infinity;
    for (let x = -7; x <= 7; x += 0.02) {
      const [l1, l2] = losses([x, -8.3552]);
      const L = (l1 + l2) / 2;
      if (L < bestL) { bestL = L; best = [x, -8.3552]; }
    }
    const [sx, sy] = px(best);
    ctx.fillStyle = "#e9e7e2";
    ctx.font = "22px sans-serif";
    ctx.fillText("★", sx - 10, sy + 7);

    // trails
    for (const m of METHODS) {
      const path = trails[m.key];
      const n = Math.max(2, Math.floor(path.length * progress));
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const [x, y] = px(path[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      const [ex, ey] = px(path[n - 1]);
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, 7); ctx.fill();
    }
    // start dot
    const [stx, sty] = px(start);
    ctx.fillStyle = "#050100";
    ctx.strokeStyle = "#e9e7e2";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(stx, sty, 6, 0, 7); ctx.fill(); ctx.stroke();
  }, [bg, trails, progress, start]);

  useEffect(() => {
    if (!running) return;
    const t0 = performance.now();
    const dur = 6000;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setProgress(p);
      if (p < 1) animRef.current = requestAnimationFrame(step);
      else setRunning(false);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, trails]);

  const finals = useMemo(
    () =>
      METHODS.map((m) => {
        const end = trails[m.key][trails[m.key].length - 1];
        const [l1, l2] = losses(end);
        return { ...m, L: (l1 + l2) / 2 };
      }),
    [trails]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
        {STARTS.map((s) => (
          <button
            key={s.join(",")}
            className={`btn btn-ghost ${start[0] === s[0] && start[1] === s[1] ? "on" : ""}`}
            style={{ minHeight: 44, padding: "0 14px", fontSize: 12 }}
            onClick={() => { setStart(s); setProgress(1); setRunning(false); }}
          >
            start ({s[0]}, {s[1]})
          </button>
        ))}
        <button className="btn btn-gold" style={{ minHeight: 44 }} onClick={() => { setProgress(0); setRunning(true); }}>
          {running ? "Walking…" : "Replay race"}
        </button>
      </div>
      <div style={{ background: "var(--bg-tinted)", borderRadius: 14, border: "1px solid rgba(203,198,185,.12)", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" style={{ marginTop: 12 }}>
        {finals.map((f) => (
          <div key={f.key} className="box" style={{ margin: 0, padding: "10px 12px", background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
            <div className="small" style={{ color: f.color }}>{f.label}</div>
            <div className="mono" style={{ color: "var(--lighter)", fontSize: 17 }}>{f.L.toFixed(2)}</div>
            <div className="small dim">final avg loss</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <Figure8Grid />
        <ConflictChunks run={runs.gd} />
        <LossCurves runs={runs} />
        <LossSpace runs={runs} cagradC={cagradC} c={c} setC={setC} />
      </div>
      <p className="small dim" style={{ marginTop: 10 }}>
        The real landscape of the paper's §5.1: two ravines carved through the upper half, two bowls below, the gray bar is the Pareto set, ★ is its best point. <strong style={{ color: "var(--lighter)" }}>Try this:</strong> press Replay race, then switch starting points. You should see GD (red) pace inside the ravine while CAGrad (blue) walks to the ★. <strong style={{ color: "var(--lighter)" }}>Takeaway:</strong> in this replay GD's two gradients fight on {(runs.gd.confFrac * 100).toFixed(0)}% of all steps, and the fighting never lets up once it is trapped. Conflict is not a passing storm, it is the climate of the trap — and no learning-rate schedule escapes it. (The paper runs 100,000 Adam steps at 10⁻³, minimum average loss −15.09; this replay uses 20,000 steps at 2×10⁻³ so it finishes while you watch.)
      </p>
    </div>
  );
}
