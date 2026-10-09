import { useMemo, useState } from "react";

// Fig 2(a): Scale — bars of gradient norm, slider for task 2's loss scale
export function ScaleWidget() {
  const [scale, setScale] = useState(300);
  const n1 = 1, n2 = scale;
  const share = n2 / (n1 + n2);
  return (
    <div>
      <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>task 2's loss scale (task 1 = 1)</span>
        <span className="mono" style={{ color: "#c6a1ce" }}>{scale}×</span>
      </div>
      <input type="range" min={1} max={1000} step={1} value={scale} onChange={(e) => setScale(+e.target.value)} />
      <svg viewBox="0 0 300 110" style={{ width: "100%", display: "block" }}>
        <rect x={10} y={82} width={Math.max(2, (n1 / (n1 + n2)) * 560 / 2)} height={18} rx={3} fill="#c6a1ce" />
        <rect x={10} y={52} width={Math.max(2, (n2 / (n1 + n2)) * 280)} height={18} rx={3} fill="#aaf7b3" />
        <text x={14} y={45} fontSize={10} fill="#aaf7b3">task 2 gradient</text>
        <text x={14} y={108} fontSize={10} fill="#c6a1ce">task 1 gradient</text>
      </svg>
      <div className="small dim">
        task 2 owns <strong style={{ color: "var(--lighter)" }}>{(100 * share).toFixed(1)}%</strong> of every shared
        update. At 300×, task 1 is a whisper under a shout.
      </div>
    </div>
  );
}

// Fig 2(b): Speed — two learning curves, draggable "now" marker
export function SpeedWidget() {
  const [t, setT] = useState(30);
  const f = (x: number) => Math.exp(-x / 18); // fast task
  const s = (x: number) => Math.exp(-x / 90); // slow task
  const W = 300, H = 120, P = 6;
  const px = (x: number) => P + (x / 100) * (W - 2 * P);
  const py = (y: number) => H - P - y * (H - 2 * P);
  const path = (fn: (x: number) => number) =>
    Array.from({ length: 50 }, (_, i) => `${px(i * 2.04)},${py(fn(i * 2.04))}`).join(" ");
  const now = t;
  return (
    <div>
      <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>training progress</span>
        <span className="mono" style={{ color: "#aaf7b3" }}>step {now}</span>
      </div>
      <input type="range" min={2} max={100} step={1} value={t} onChange={(e) => setT(+e.target.value)} />
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <polyline points={path(f)} fill="none" stroke="#c6a1ce" strokeWidth={2} />
        <polyline points={path(s)} fill="none" stroke="#aaf7b3" strokeWidth={2} />
        <line x1={px(now)} x2={px(now)} y1={P} y2={H - P} stroke="#c0924e" strokeDasharray="3 4" />
        <circle cx={px(now)} cy={py(f(now))} r={4} fill="#c6a1ce" />
        <circle cx={px(now)} cy={py(s(now))} r={4} fill="#aaf7b3" />
        <text x={px(60)} y={py(f(60)) + 14} fontSize={10} fill="#c6a1ce">fast task</text>
        <text x={px(60)} y={py(s(60)) - 6} fontSize={10} fill="#aaf7b3">slow task</text>
      </svg>
      <div className="small dim">
        at this step the fast task's gradient has shrunk to{" "}
        <strong style={{ color: "var(--lighter)" }}>{(100 * f(now)).toFixed(0)}%</strong> of its start while the slow
        task still has <strong style={{ color: "var(--lighter)" }}>{(100 * s(now)).toFixed(0)}%</strong> — a weighting
        that was fair early is unfair now.
      </div>
    </div>
  );
}

// Fig 2(c): Direction — draggable second gradient, shows cosine and whether the sum betrays task 2
export function DirectionWidget() {
  const [ang, setAng] = useState(150);
  const g1 = { x: 1.8, y: 0.3 };
  const rad = (ang * Math.PI) / 180;
  const g2 = { x: 1.4 * Math.cos(rad), y: 1.4 * Math.sin(rad) };
  const sum = { x: g1.x + g2.x, y: g1.y + g2.y };
  const dot12 = g1.x * g2.x + g1.y * g2.y;
  const cos = dot12 / (Math.hypot(g1.x, g1.y) * Math.hypot(g2.x, g2.y));
  const score2 = sum.x * g2.x + sum.y * g2.y;
  const S = 34, C = 70;
  const px = (v: { x: number; y: number }) => ({ cx: C + v.x * S, cy: 80 - v.y * S });
  return (
    <div>
      <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>direction of g₂ (g₁ fixed)</span>
        <span className="mono" style={{ color: cos < 0 ? "var(--danger)" : "var(--pcgrad)" }}>cos = {cos.toFixed(2)}</span>
      </div>
      <input type="range" min={0} max={180} step={1} value={ang} onChange={(e) => setAng(+e.target.value)} />
      <svg viewBox="0 0 140 130" style={{ width: "100%", display: "block", background: "rgba(203,198,185,.04)", borderRadius: 10 }}>
        <line x1={C} y1={80} x2={px(g1).cx} y2={px(g1).cy} stroke="#c6a1ce" strokeWidth={2.5} />
        <line x1={C} y1={80} x2={px(g2).cx} y2={px(g2).cy} stroke="#aaf7b3" strokeWidth={2.5} />
        <line x1={C} y1={80} x2={px(sum).cx} y2={px(sum).cy} stroke="#c0924e" strokeWidth={2.5} />
        <circle cx={px(sum).cx} cy={px(sum).cy} r={3.5} fill="#c0924e" />
        <text x={px(g1).cx + 4} y={px(g1).cy + 4} fontSize={10} fill="#c6a1ce">g₁</text>
        <text x={px(g2).cx - 16} y={px(g2).cy} fontSize={10} fill="#aaf7b3">g₂</text>
        <text x={px(sum).cx + 5} y={px(sum).cy - 5} fontSize={10} fill="#c0924e">sum</text>
      </svg>
      <div className="small dim">
        {cos < 0
          ? score2 < 0
            ? "conflict: the sum pushes task 2 uphill — its score is negative. No volume knob fixes a direction problem."
            : "conflict (cos < 0), though this time the sum happens to spare task 2."
          : "no conflict: the arrows partly agree, the sum helps both."}
      </div>
    </div>
  );
}

export function FailureModesGrid() {
  const cells = useMemo(
    () => [
      { t: "(a) Scale", c: "#c6a1ce", el: <ScaleWidget /> },
      { t: "(b) Speed", c: "#aaf7b3", el: <SpeedWidget /> },
      { t: "(c) Direction", c: "#efedbd", el: <DirectionWidget /> },
    ],
    []
  );
  return (
    <div className="grid md:grid-cols-3 gap-3" style={{ margin: "18px 0" }}>
      {cells.map((x) => (
        <div key={x.t} className="box" style={{ margin: 0, background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
          <div className="box-label" style={{ color: x.c }}>{x.t}</div>
          {x.el}
        </div>
      ))}
    </div>
  );
}
