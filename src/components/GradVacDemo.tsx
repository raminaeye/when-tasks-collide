import { useState } from "react";

type V = { x: number; y: number };
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
const norm = (a: V) => Math.hypot(a.x, a.y);
const add = (a: V, b: V) => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: V, s: number) => ({ x: a.x * s, y: a.y * s });

export default function GradVacDemo() {
  // Task 1 gradient fixed; rotate task 2's gradient to change the cosine.
  const g1: V = { x: 2.2, y: 0.6 };
  const [angle, setAngle] = useState(115); // degrees from g1 direction
  const [target, setTarget] = useState(0.3);
  const [beta, setBeta] = useState(0.01);

  const base = Math.atan2(g1.y, g1.x);
  const rad = base + (angle * Math.PI) / 180;
  const g2: V = { x: 1.8 * Math.cos(rad), y: 1.8 * Math.sin(rad) };
  const cos = dot(g1, g2) / (norm(g1) * norm(g2));

  // Solve numerically for a so that cos(g1 + a*g2, g2) = target (bisection)
  let a = 0;
  let acts = false;
  if (cos < target) {
    acts = true;
    let lo = 0, hi = 50;
    const f = (t: number) => {
      const v = add(g1, scale(g2, t));
      return dot(v, g2) / (norm(v) * norm(g2));
    };
    // f increasing in t toward 1; find t with f = target
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < target) lo = mid;
      else hi = mid;
    }
    a = (lo + hi) / 2;
  }
  const edited = add(g1, scale(g2, a));
  const newCos = dot(edited, g2) / (norm(edited) * norm(g2));

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>angle between g₁ and g₂</span>
          <span className="mono" style={{ color: "var(--gradvac)" }}>{angle}° · cos = {cos.toFixed(2)}</span>
        </div>
        <input type="range" min={10} max={175} step={1} value={angle} onChange={(e) => setAngle(+e.target.value)} />
      </div>
      <div style={{ marginBottom: 6 }}>
        <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>pair's running target φ̂ (its historical normal)</span>
          <span className="mono" style={{ color: "var(--gradvac)" }}>{target.toFixed(2)}</span>
        </div>
        <input type="range" min={-0.5} max={0.9} step={0.02} value={target} onChange={(e) => setTarget(+e.target.value)} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>target averaging speed β</span>
          <span className="mono" style={{ color: "var(--gradvac)" }}>{beta.toFixed(3)}</span>
        </div>
        <input type="range" min={0.001} max={0.1} step={0.001} value={beta} onChange={(e) => setBeta(+e.target.value)} />
      </div>

      <div className="box" style={{ margin: "10px 0 0", background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
        {acts ? (
          <>
            <div className="small" style={{ color: "var(--danger)" }}>
              cos {cos.toFixed(2)} is below the target {target.toFixed(2)}: alignment is sagging, so GradVac acts before a real fight starts.
            </div>
            <div className="mono" style={{ marginTop: 8, color: "var(--lighter)" }}>
              nudge: g₁ ← g₁ + {a.toFixed(3)}·g₂
            </div>
            <div className="small dim" style={{ marginTop: 6 }}>
              check: cos(g₁′, g₂) = {newCos.toFixed(2)} — exactly back at the pair's own target, not at zero.
              {" "}PCGrad would only act if cos went below 0 and would push all the way to 0, blocking this pair's natural cooperation.
            </div>
          </>
        ) : (
          <div className="small" style={{ color: "var(--pcgrad)" }}>
            cos {cos.toFixed(2)} ≥ target {target.toFixed(2)}: the pair is as aligned as usual, so a = 0 and nothing happens. GradVac only tops up pairs that sag below their own normal.
          </div>
        )}
        <div className="small dim" style={{ marginTop: 8 }}>
          The target itself updates slowly: φ̂ ← (1−β)φ̂ + β·cos. At β = {beta.toFixed(3)}, one noisy batch moves the target by only {(beta * 100).toFixed(1)}% of the gap — a slow memory, not a knee-jerk.
        </div>
      </div>
    </div>
  );
}
