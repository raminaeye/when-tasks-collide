import { useMemo, useState } from "react";

/* Shared shell: a numbered walkthrough you step through with buttons.
   Each step shows one computation, slowly, in the paper's order. */
function Walkthrough({
  label,
  color,
  steps,
}: {
  label: string;
  color: string;
  steps: { t: string; math: React.ReactNode; d: React.ReactNode }[];
}) {
  const [n, setN] = useState(0);
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color }}>{label}</div>
      <div style={{ display: "grid", gap: 10 }}>
        {steps.slice(0, n + 1).map((s, i) => (
          <div key={i} className={i === n ? "fadein" : ""} style={{ opacity: i === n ? 1 : 0.45 }}>
            <div className="small" style={{ color: "var(--lighter)", fontWeight: 600 }}>
              <span className="mono" style={{ color, marginRight: 8 }}>{String(i + 1).padStart(2, "0")}</span>
              {s.t}
            </div>
            <div className="eq" style={{ margin: "6px 0" }}>{s.math}</div>
            <div className="small dim">{s.d}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2" style={{ marginTop: 12 }}>
        <button className="btn btn-ghost" style={{ minHeight: 44, minWidth: 44 }} disabled={n === 0} onClick={() => setN(Math.max(0, n - 1))}>
          ←
        </button>
        <button className="btn btn-gold" style={{ minHeight: 44 }} disabled={n === steps.length - 1} onClick={() => setN(Math.min(steps.length - 1, n + 1))}>
          Next step →
        </button>
        <button className="btn btn-ghost" style={{ minHeight: 44 }} onClick={() => setN(steps.length - 1)}>Show all</button>
        <button className="btn btn-ghost" style={{ minHeight: 44 }} onClick={() => setN(0)}>Restart</button>
      </div>
    </div>
  );
}

const M = ({ children }: { children: React.ReactNode }) => <span className="mono">{children}</span>;

/* ---------- Worked example C.1: the failure, with numbers (§2.3) ---------- */
export function C1Walkthrough() {
  return (
    <Walkthrough
      label="Worked example C.1 · the failure, with numbers — step by step"
      color="#f0927e"
      steps={[
        {
          t: "The scene: two tasks, two knobs",
          math: <M>g₁ = (2, 0) &nbsp;&nbsp; g₂ = (−1, 0.5)</M>,
          d: "Two tasks share two knobs, so every gradient is an arrow with two entries — small enough to draw. Task 1's uphill arrow points east with length 2. Task 2's points west and slightly north, length ≈ 1.1. These numbers are invented, chosen so we can draw everything.",
        },
        {
          t: "The step plain training takes",
          math: <M>d = g₀ = ½(g₁ + g₂) = (0.5, 0.25)</M>,
          d: "Plain gradient descent follows the average of the two arrows. Notice it leans task 1's way: task 1's arrow is longer, so it pulls the average toward itself.",
        },
        {
          t: "The referee: how to score a step",
          math: <M>score of task i = ⟨gᵢ, d⟩ — positive means task i's loss goes down</M>,
          d: "Why the sign works: the actual move is −αd (we step opposite to the uphill arrows). So if d points along task i's uphill arrow, the move goes downhill for that task. The dot product from §3.1 is the whole instrument.",
        },
        {
          t: "Task 1's score",
          math: <M>⟨g₁, d⟩ = 2(0.5) + 0(0.25) = +1 &gt; 0</M>,
          d: "Multiply matching entries and add. Positive: the step helps task 1. In the picture, d and g₁ point the same way.",
        },
        {
          t: "Task 2's score — the betrayal",
          math: <M>⟨g₂, d⟩ = (−1)(0.5) + (0.5)(0.25) = −0.5 + 0.125 = −0.375 &lt; 0</M>,
          d: "Same recipe, opposite verdict. The very same step pushes task 2's loss UP. In the picture, d points against g₂.",
        },
        {
          t: "The verdict",
          math: <M>‖g₁‖ = 2 versus ‖g₂‖ ≈ 1.1 — the loud task outvotes the quiet one</M>,
          d: "That is the entire conflict problem in one line of arithmetic: the majority opinion overrules a minority of one. PCGrad (§5) and CAGrad (§6) are two different ways of editing d so that both scores come out positive.",
        },
      ]}
    />
  );
}

/* ---------- Worked example C.2: one GradNorm update, with numbers (§4.1) ----------
   Interactive: change the four losses and the two measured loudnesses, and every
   quantity in the five-step update recomputes. */
export function C2Walkthrough() {
  const [L0a, setL0a] = useState(2);
  const [L0b, setL0b] = useState(800);
  const [Lta, setLta] = useState(0.5);
  const [Ltb, setLtb] = useState(600);
  const [G1, setG1] = useState(4);
  const [G2, setG2] = useState(400);
  const alpha = 0.5;

  const c = useMemo(() => {
    const ratio = [Lta / L0a, Ltb / L0b];
    const meanR = (ratio[0] + ratio[1]) / 2;
    const r = [ratio[0] / meanR, ratio[1] / meanR];
    const meanG = (G1 + G2) / 2;
    const target = [meanG * Math.pow(r[0], alpha), meanG * Math.pow(r[1], alpha)];
    const miss = [Math.abs(G1 - target[0]), Math.abs(G2 - target[1])];
    // one weight update (paper's B.2): w -= lr * sign(G - target) * G / w, then renormalize to sum 2
    const lr = 0.001;
    let w = [1 - lr * Math.sign(G1 - target[0]) * G1, 1 - lr * Math.sign(G2 - target[1]) * G2];
    const s = w[0] + w[1];
    w = [(w[0] * 2) / s, (w[1] * 2) / s];
    return { ratio, r, meanG, target, miss, w, meanR };
  }, [L0a, L0b, Lta, Ltb, G1, G2]);

  const sliders: { label: string; v: number; set: (x: number) => void; min: number; max: number; step: number; log?: boolean }[] = [
    { label: "task 1 loss at start L₁(0)", v: L0a, set: setL0a, min: 1, max: 10, step: 0.5 },
    { label: "task 1 loss now L₁(t)", v: Lta, set: setLta, min: 0.1, max: 10, step: 0.1 },
    { label: "task 2 loss at start L₂(0)", v: L0b, set: setL0b, min: 200, max: 2000, step: 50 },
    { label: "task 2 loss now L₂(t)", v: Ltb, set: setLtb, min: 50, max: 2000, step: 25 },
    { label: "loudness G₁ (quiet task)", v: G1, set: setG1, min: 1, max: 100, step: 1 },
    { label: "loudness G₂ (loud task)", v: G2, set: setG2, min: 100, max: 1000, step: 10 },
  ];

  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gradnorm)" }}>Worked example C.2 · one GradNorm update — change the numbers, watch the loop think</div>
      <div className="grid md:grid-cols-2 gap-3" style={{ margin: "4px 0 10px" }}>
        {sliders.map((s) => (
          <div key={s.label}>
            <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{s.label}</span>
              <span className="mono" style={{ color: "var(--lighter)" }}>{s.v}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={(e) => s.set(+e.target.value)} />
          </div>
        ))}
      </div>
      <ol className="steps">
        <li>
          <strong>Loss ratios — how far down is each task?</strong>{" "}
          <span className="mono">L̃₁ = {Lta}/{L0a} = {c.ratio[0].toFixed(2)}, &nbsp; L̃₂ = {Ltb}/{L0b} = {c.ratio[1].toFixed(2)}</span>
          <div className="small dim">Task 1 is {(100 * (1 - c.ratio[0])).toFixed(0)}% of the way down; task 2 only {(100 * (1 - c.ratio[1])).toFixed(0)}%.</div>
        </li>
        <li>
          <strong>Relative rates — who is behind the pack?</strong>{" "}
          <span className="mono">mean = {c.meanR.toFixed(2)}, so r₁ = {c.r[0].toFixed(2)} ({c.r[0] < 1 ? "ahead" : "behind"}), r₂ = {c.r[1].toFixed(2)} ({c.r[1] < 1 ? "ahead" : "behind"})</span>
          <div className="small dim">The ratio alone doesn't tell you who needs help — only the comparison against the group does.</div>
        </li>
        <li>
          <strong>Current loudness.</strong>{" "}
          <span className="mono">G₁ = {G1}, G₂ = {G2}, Ḡ = {c.meanG}</span>
          <div className="small dim">Measured gradient norms at the last shared layer. The average is the reference volume everyone is compared against.</div>
        </li>
        <li>
          <strong>Targets with α = 0.5.</strong>{" "}
          <span className="mono">task 1: {c.meanG} × {c.r[0].toFixed(2)}^0.5 ≈ {c.target[0].toFixed(0)} · task 2: {c.meanG} × {c.r[1].toFixed(2)}^0.5 ≈ {c.target[1].toFixed(0)}</span>
          <div className="small dim">Average loudness, boosted for whoever is behind: two fixes in one formula (scale and speed).</div>
        </li>
        <li>
          <strong>The penalty and the nudge.</strong>{" "}
          <span className="mono">L_grad = |{G1} − {c.target[0].toFixed(0)}| + |{G2} − {c.target[1].toFixed(0)}| = {c.miss[0].toFixed(0)} + {c.miss[1].toFixed(0)}</span>
          <div className="small dim">
            To shrink it, GradNorm {G1 < c.target[0] ? "raises" : "lowers"} w₁ (task 1 is {G1 < c.target[0] ? "too quiet" : "too loud"}) and {G2 > c.target[1] ? "lowers" : "raises"} w₂, then rescales to the fixed budget of 2:{" "}
            <span className="mono" style={{ color: "var(--lighter)" }}>w → [{c.w[0].toFixed(3)}, {c.w[1].toFixed(3)}]</span>.
          </div>
        </li>
      </ol>
      <div className="small dim" style={{ marginTop: 8 }}>
        <strong style={{ color: "var(--lighter)" }}>Try this:</strong> drag "task 2 loss now" down toward 50 and watch r₂ drop below 1 — the boost
        evaporates once task 2 is no longer behind. Then drag G₂ down toward 100 and watch the target gap shrink.{" "}
        <strong style={{ color: "var(--lighter)" }}>Takeaway:</strong> the scale term pulls both norms toward the common average, the rate term
        [rᵢ]^α shifts the target toward whoever is behind — and you can see both forces in the two arrows of one update.
      </div>
    </div>
  );
}

/* ---------- Deep dive C.4: the dual trick, why this is computable (§6.1) ---------- */
export function C4Walkthrough() {
  return (
    <Walkthrough
      label="Deep dive C.4 · the dual trick — why CAGrad is computable at all"
      color="var(--cagrad)"
      steps={[
        {
          t: "The problem with the primal",
          math: <M>d lives in R^m — millions of dimensions for a deep network</M>,
          d: "The primal problem searches over the update direction d directly. For a real network that search space is the size of the parameter list, so solving it exactly at every step is out of the question.",
        },
        {
          t: "Step one: rewrite 'worst task' as 'worst blend'",
          math: <M>minᵢ ⟨gᵢ, d⟩ = min (w ∈ Δ) ⟨g_w, d⟩, where g_w = Σᵢ wᵢ gᵢ</M>,
          d: "The inner minimum over tasks can be rewritten as a minimum over all blends in the simplex Δ (every way to split 100% among tasks). This works because of the fact from §3.1: a blend cannot hide below its worst ingredient — the worst blend is always just the worst single task.",
        },
        {
          t: "Step two: swap the min and the max",
          math: <M>max_d min_w  →  min_w max_d, and solve the inner problem exactly</M>,
          d: "Standard duality arguments let us swap the order. The inner maximization over d, inside the trust ball, now has a closed-form answer, which collapses the whole problem…",
        },
        {
          t: "The collapse: millions of dimensions down to K",
          math: <M>w* = argmin (w ∈ Δ) F(w), &nbsp; F(w) = g_wᵀg₀ + √φ‖g_w‖, &nbsp; φ = c²‖g₀‖²</M>,
          d: "…into a search over K blend weights, one per task. K is usually 2 to 50, so this small problem is solved almost for free at each step (the paper's code does it with an off-the-shelf solver; our playground uses a fine grid).",
        },
        {
          t: "Step three: read the answer as a sentence",
          math: <M>d = g₀ + c‖g₀‖ · ĝ_w*  &nbsp;(then scaled by 1/(1+c))</M>,
          d: "The update is the average gradient plus a bounded correction of length c‖g₀‖ in the direction of the best blend. The 'hat' means 'scaled to length one': it keeps only the blend's direction, while c‖g₀‖ supplies the length. 'Best' means the blend that best trades helping the worst-off task against staying near g₀.",
        },
        {
          t: "Why you should care",
          math: <M>same answer as the primal · K-dimensional search · tiny solve cost per step</M>,
          d: "Duality doesn't approximate the diplomat-on-a-leash rule — it is the same answer, computed in a vastly smaller room. That is what makes a proof-backed method practical inside a training loop.",
        },
      ]}
    />
  );
}
