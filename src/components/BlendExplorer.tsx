import { useMemo, useState } from "react";

type V = { x: number; y: number };
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
const norm = (a: V) => Math.hypot(a.x, a.y);

// Pareto / blend explorer: two fixed gradients, slider over the simplex.
export default function BlendExplorer() {
  const g1: V = { x: 2, y: 0 };
  const g2: V = { x: -1, y: 1.6 };
  const [w, setW] = useState(0.62);

  const blend = { x: w * g1.x + (1 - w) * g2.x, y: w * g1.y + (1 - w) * g2.y };
  const blendNorm = norm(blend);

  const mgdaW = useMemo(() => {
    const d = { x: g1.x - g2.x, y: g1.y - g2.y };
    const e = { x: g2.x - g1.x, y: g2.y - g1.y }; // g2 - g1: min-norm weight is <g2, g2-g1> / ||g1-g2||^2
    const denom = dot(d, d);
    return Math.min(1, Math.max(0, dot(g2, e) / denom));
  }, []);

  const SCALE = 62;
  const cx = 170, cy = 150;
  const px = (v: V) => ({ cx: cx + v.x * SCALE, cy: cy - v.y * SCALE });

  const score1 = dot(blend, g1);
  const score2 = dot(blend, g2);

  return (
    <div>
      <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>blend: w·g₁ + (1−w)·g₂</span>
        <span className="mono" style={{ color: "var(--gold)" }}>w = {w.toFixed(2)}</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={w} onChange={(e) => setW(+e.target.value)} />
      <div style={{ background: "var(--bg-tinted)", borderRadius: 14, border: "1px solid rgba(203,198,185,.12)", overflow: "hidden" }}>
        <svg viewBox="0 0 340 260" style={{ width: "100%", display: "block" }}>
          <line x1={0} y1={cy} x2={340} y2={cy} stroke="rgba(203,198,185,.15)" />
          <line x1={cx} y1={0} x2={cx} y2={260} stroke="rgba(203,198,185,.15)" />
          {/* simplex line between g1 and g2 endpoints */}
          <line x1={px(g1).cx} y1={px(g1).cy} x2={px(g2).cx} y2={px(g2).cy} stroke="rgba(192,146,78,.5)" strokeDasharray="4 5" />
          <line x1={cx} y1={cy} x2={px(g1).cx} y2={px(g1).cy} stroke="#c6a1ce" strokeWidth={2.5} />
          <line x1={cx} y1={cy} x2={px(g2).cx} y2={px(g2).cy} stroke="#aaf7b3" strokeWidth={2.5} />
          <line x1={cx} y1={cy} x2={px(blend).cx} y2={px(blend).cy} stroke="#c0924e" strokeWidth={3.5} />
          <circle cx={px(g1).cx} cy={px(g1).cy} r={5} fill="#c6a1ce" />
          <circle cx={px(g2).cx} cy={px(g2).cy} r={5} fill="#aaf7b3" />
          <circle cx={px(blend).cx} cy={px(blend).cy} r={6} fill="#c0924e" />
          <text x={px(g1).cx + 8} y={px(g1).cy + 4} fill="#c6a1ce" fontSize={12}>g₁</text>
          <text x={px(g2).cx - 20} y={px(g2).cy + 4} fill="#aaf7b3" fontSize={12}>g₂</text>
          {Math.abs(w - mgdaW) < 0.05 && (
            <text x={px(blend).cx + 10} y={px(blend).cy - 8} fill="#efedbd" fontSize={11}>MGDA point</text>
          )}
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2" style={{ marginTop: 10 }}>
        <div className="box" style={{ margin: 0, padding: "10px 12px", background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
          <div className="small dim">‖blend‖</div>
          <div className="mono" style={{ color: "var(--gold)", fontSize: 17 }}>{blendNorm.toFixed(2)}</div>
        </div>
        <div className="box" style={{ margin: 0, padding: "10px 12px", background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
          <div className="small dim">⟨blend, g₁⟩</div>
          <div className="mono" style={{ color: score1 >= 0 ? "var(--pcgrad)" : "var(--danger)", fontSize: 17 }}>{score1.toFixed(2)}</div>
        </div>
        <div className="box" style={{ margin: 0, padding: "10px 12px", background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
          <div className="small dim">⟨blend, g₂⟩</div>
          <div className="mono" style={{ color: score2 >= 0 ? "var(--pcgrad)" : "var(--danger)", fontSize: 17 }}>{score2.toFixed(2)}</div>
        </div>
      </div>
      <p className="small dim" style={{ marginTop: 10 }}>
        <strong style={{ color: "var(--lighter)" }}>Try this:</strong> slide w slowly from 0 to 1 and watch the blend's length. It bottoms out at w ≈ {mgdaW.toFixed(2)} — the shortest legal blend, which is exactly the step MGDA takes. <strong style={{ color: "var(--lighter)" }}>Takeaway:</strong> every blend lands on the dashed line between the arrowheads (the simplex), and no blend can score below both ingredients at once — "search over blends" is "protect the worst task," only cheaper.
      </p>
    </div>
  );
}
