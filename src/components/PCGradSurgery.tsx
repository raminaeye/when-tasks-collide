import { useState } from "react";

type V = { x: number; y: number };
const g1: V = { x: 3, y: 1 };
const g2: V = { x: -1, y: 2 };
const dot12 = g1.x * g2.x + g1.y * g2.y; // -1
const n2sq = g2.x * g2.x + g2.y * g2.y; // 5
const n1sq = g1.x * g1.x + g1.y * g1.y; // 10
const shadow1 = { x: (dot12 / n2sq) * g2.x, y: (dot12 / n2sq) * g2.y }; // (0.2,-0.4)
const shadow2 = { x: (dot12 / n1sq) * g1.x, y: (dot12 / n1sq) * g1.y }; // (-0.3,-0.1)
const g1p = { x: g1.x - shadow1.x, y: g1.y - shadow1.y }; // (2.8,1.4)
const g2p = { x: g2.x - shadow2.x, y: g2.y - shadow2.y }; // (-0.7,2.1)
const sum0 = { x: g1.x + g2.x, y: g1.y + g2.y }; // (2,3)
const sum1 = { x: g1p.x + g2p.x, y: g1p.y + g2p.y }; // (2.1,3.5)

const STEPS_INFO = [
  {
    t: "1 · Check for a fight",
    d: "⟨g₁,g₂⟩ = 3(−1) + 1(2) = −1 < 0 — the arrows partly pull against each other, so the cut is needed. The gold arrow is the naive sum (2, 3).",
  },
  {
    t: "2 · Compute the shadows",
    d: "shadow of g₁ on g₂ = (−1/5)·g₂ = (0.2, −0.4) — the minus sign means it points against g₂: exactly the offending part. Same on the other side: (−0.3, −0.1).",
  },
  {
    t: "3 · Subtract them",
    d: "g₁ ← (3,1) − (0.2,−0.4) = (2.8, 1.4) and g₂ ← (−1,2) − (−0.3,−0.1) = (−0.7, 2.1). Each is now at an exact right angle to the other task's gradient: ⟨(2.8,1.4), g₂⟩ = −2.8 + 2.8 = 0.",
  },
  {
    t: "4 · Add what's left",
    d: "The update changes from (2, 3) to (2.1, 3.5) — nearly the same step, but now guaranteed to contain nothing that fights either task. Scores: ⟨d,g₁⟩ = 9.8, ⟨d,g₂⟩ = 4.9, both positive.",
  },
];

export default function PCGradSurgery() {
  const [step, setStep] = useState(0);
  const S = 46, W = 480, H = 360;
  const cx = W / 2, cy = H * 0.62;
  const px = (v: V) => ({ cx: cx + v.x * S, cy: cy - v.y * S });

  const Arrow = ({ v, color, width = 3, dash, op = 1 }: { v: V; color: string; width?: number; dash?: string; op?: number }) => (
    <line x1={cx} y1={cy} x2={px(v).cx} y2={px(v).cy} stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={op} markerEnd={`url(#sg-${color.slice(1)})`} />
  );

  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--pcgrad)" }}>Figures 6–7 · the surgery, step by step</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <defs>
          {["c6a1ce", "aaf7b3", "c0924e", "f0927e", "e9e7e2"].map((h) => (
            <marker key={h} id={`sg-${h}`} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6.5} markerHeight={6.5} orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={`#${h}`} />
            </marker>
          ))}
        </defs>
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="rgba(203,198,185,.15)" />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="rgba(203,198,185,.15)" />

        {/* originals, fading as surgery proceeds */}
        <Arrow v={g1} color="#c6a1ce" op={step >= 3 ? 0.3 : 1} dash={step >= 3 ? "5 5" : undefined} />
        <Arrow v={g2} color="#aaf7b3" op={step >= 3 ? 0.3 : 1} dash={step >= 3 ? "5 5" : undefined} />
        {step === 0 && <Arrow v={sum0} color="#c0924e" width={3.5} />}
        {step === 0 && (
          <text x={px(sum0).cx + 8} y={px(sum0).cy} fill="#c0924e" fontSize={12}>naive sum (2, 3)</text>
        )}

        {step >= 1 && (
          <>
            <line x1={px(g1).cx} y1={px(g1).cy} x2={px({ x: g1.x - shadow1.x, y: g1.y - shadow1.y }).cx} y2={px({ x: g1.x - shadow1.x, y: g1.y - shadow1.y }).cy} stroke="#f0927e" strokeWidth={4} strokeOpacity={0.85} />
            <line x1={px(g2).cx} y1={px(g2).cy} x2={px({ x: g2.x - shadow2.x, y: g2.y - shadow2.y }).cx} y2={px({ x: g2.x - shadow2.x, y: g2.y - shadow2.y }).cy} stroke="#f0927e" strokeWidth={4} strokeOpacity={0.85} />
            <text x={px(g1).cx - 6} y={px(g1).cy - 30} fill="#f0927e" fontSize={11}>cut</text>
            <text x={px(g2).cx + 6} y={px(g2).cy + 26} fill="#f0927e" fontSize={11}>cut</text>
          </>
        )}

        {step >= 2 && (
          <>
            <Arrow v={g1p} color="#c6a1ce" width={3.5} />
            <Arrow v={g2p} color="#aaf7b3" width={3.5} />
            <text x={px(g1p).cx + 10} y={px(g1p).cy} fill="#c6a1ce" fontSize={12}>g₁⊥ (2.8, 1.4)</text>
            <text x={px(g2p).cx - 10} y={px(g2p).cy} fill="#aaf7b3" fontSize={12} textAnchor="end">g₂⊥ (−0.7, 2.1)</text>
          </>
        )}

        {step >= 3 && (
          <>
            <Arrow v={sum1} color="#c0924e" width={4} />
            <text x={px(sum1).cx + 10} y={px(sum1).cy} fill="#c0924e" fontSize={12} fontWeight={700}>d = (2.1, 3.5)</text>
          </>
        )}
        <text x={px(g1).cx + 8} y={px(g1).cy + 16} fill="#c6a1ce" fontSize={11} opacity={0.8}>g₁ = (3, 1)</text>
        <text x={px(g2).cx - 8} y={px(g2).cy - 8} fill="#aaf7b3" fontSize={11} opacity={0.8} textAnchor="end">g₂ = (−1, 2)</text>
      </svg>

      <div style={{ minHeight: 52, margin: "8px 0" }}>
        <div className="small" style={{ color: "var(--lighter)", fontWeight: 600 }}>{STEPS_INFO[step].t}</div>
        <div className="small dim">{STEPS_INFO[step].d}</div>
      </div>
      <div className="flex gap-2">
        {STEPS_INFO.map((_, i) => (
          <button key={i} className={`btn ${step === i ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, minWidth: 44, padding: "0 14px" }} onClick={() => setStep(i)}>
            {i + 1}
          </button>
        ))}
        <button className="btn btn-ghost" style={{ minHeight: 44, padding: "0 16px" }} onClick={() => setStep((step + 1) % 4)}>
          Next →
        </button>
      </div>
    </div>
  );
}
