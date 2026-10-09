import { useMemo, useState } from "react";

// Schematic replay of the paper's Figure 5 toy: task 2 is 300x louder than task 1.
const S = [1, 300];
const STEPS = 600;
const K = 0.02;

function run(mode: "alone1" | "alone2" | "eq" | "gn", alpha: number) {
  const L = [1, 1];
  const L0 = [1, 1];
  const w = [1, 1];
  const hist = { l1: [] as number[], l2: [] as number[], w1: [] as number[], w2: [] as number[], gap: [] as number[] };
  for (let t = 0; t < STEPS; t++) {
    const G = [w[0] * S[0] * L[0], w[1] * S[1] * L[1]];
    const sum = G[0] + G[1] || 1e-9;
    hist.gap.push(G[1] / Math.max(G[0], 1e-9));
    // training alone: the model hears only that one task, at full strength
    if (mode === "alone1") L[0] *= Math.exp(-K);
    else if (mode === "alone2") L[1] *= Math.exp(-K);
    else for (let i = 0; i < 2; i++) L[i] *= Math.exp(-K * (G[i] / sum));
    if (mode === "gn") {
      const meanG = (G[0] + G[1]) / 2;
      const ratio = [L[0] / L0[0], L[1] / L0[1]];
      const meanR = (ratio[0] + ratio[1]) / 2 || 1e-9;
      for (let i = 0; i < 2; i++) {
        const r = ratio[i] / meanR;
        const target = meanG * Math.pow(r, alpha);
        const grad = Math.sign(G[i] - target) * S[i] * L[i];
        w[i] -= 0.015 * (grad / (S[i] * L[i] + 1e-9)) * Math.min(1, Math.abs(G[i] - target) / (meanG + 1e-9));
        w[i] = Math.max(0.02, w[i]);
      }
      const ws = w[0] + w[1];
      w[0] *= 2 / ws;
      w[1] *= 2 / ws;
    }
    hist.l1.push(L[0]);
    hist.l2.push(L[1]);
    hist.w1.push(w[0]);
    hist.w2.push(w[1]);
  }
  return hist;
}

function Chart({
  series,
  logY,
  yLabel,
  colors,
  labels,
}: {
  series: number[][];
  logY?: boolean;
  yLabel: string;
  colors: string[];
  labels: string[];
}) {
  const W = 320, H = 150, P = 8;
  const all = series.flat();
  let min = Math.min(...all), max = Math.max(...all);
  if (logY) {
    min = Math.log10(Math.max(min, 1e-6));
    max = Math.log10(max);
  }
  const mapY = (v: number) => {
    const t = logY ? Math.log10(Math.max(v, 1e-6)) : v;
    return H - P - ((t - min) / (max - min || 1)) * (H - 2 * P);
  };
  const mapX = (i: number, n: number) => P + (i / (n - 1)) * (W - 2 * P);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={P} x2={W - P} y1={H * f} y2={H * f} stroke="rgba(203,198,185,.1)" />
        ))}
        {series.map((s, si) => (
          <polyline
            key={si}
            fill="none"
            stroke={colors[si]}
            strokeWidth={2}
            points={s.map((v, i) => `${mapX(i, s.length)},${mapY(v)}`).join(" ")}
          />
        ))}
      </svg>
      <div className="small dim" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
        <span>{yLabel}{logY ? " (log)" : ""}</span>
        {labels.map((l, i) => (
          <span key={l} style={{ color: colors[i] }}>— {l}</span>
        ))}
      </div>
    </div>
  );
}

function PanelBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="box" style={{ margin: 0, background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="small" style={{ color: "var(--lighter)", marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

export default function GradNormSim() {
  const [alpha, setAlpha] = useState(0.5);
  const data = useMemo(
    () => ({ a1: run("alone1", alpha), a2: run("alone2", alpha), eq: run("eq", alpha), gn: run("gn", alpha) }),
    [alpha]
  );
  const fmt = (v: number) => (v < 0.01 ? v.toExponential(1) : v.toFixed(3));

  return (
    <div>
      <p className="small dim" style={{ marginTop: 0 }}>
        The paper's Figure 5, replayed live: one shared trunk, two tasks, task 2 starts 300× louder. Each panel
        compares three runs — each task trained <em>alone</em> (gray, the best it could hope for), both with fixed
        equal weights (red), and both with GradNorm (purple). <strong style={{ color: "var(--lighter)" }}>Try this:</strong> start with α at 0, then raise it to 1.5.
        You should see the quiet task's loss (panel a) recover toward its solo curve, the weights (panel c) swing
        toward the quiet task, and the loudness gap (panel d) snap shut. <strong style={{ color: "var(--lighter)" }}>Takeaway:</strong> the interference is
        not zero-sum — equal weights hurt <em>both</em> tasks versus training alone, and panel (d) shows the whole
        mechanism: GradNorm is an equalizer for gradient loudness, and α sets how hard it pushes.
      </p>
      <div style={{ margin: "6px 0 14px" }}>
        <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>GradNorm strength α — how hard the boost pushes for whoever is behind</span>
          <span className="mono" style={{ color: "var(--gradnorm)" }}>{alpha.toFixed(1)}</span>
        </div>
        <input type="range" min={0} max={2} step={0.1} value={alpha} onChange={(e) => setAlpha(+e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <PanelBox title="(a) task 1 loss — the quiet task · three runs">
          <Chart series={[data.a1.l1, data.eq.l1, data.gn.l1]} logY yLabel="loss" colors={["#8a8577", "#f0927e", "#c6a1ce"]} labels={["trained alone", "equal weights", "GradNorm"]} />
          <div className="small dim mono" style={{ marginTop: 6 }}>
            final: alone {fmt(data.a1.l1[STEPS - 1])} · equal {fmt(data.eq.l1[STEPS - 1])} · gradnorm {fmt(data.gn.l1[STEPS - 1])}
          </div>
        </PanelBox>
        <PanelBox title="(b) task 2 loss — the loud task · three runs">
          <Chart series={[data.a2.l2, data.eq.l2, data.gn.l2]} logY yLabel="loss" colors={["#8a8577", "#f0927e", "#c6a1ce"]} labels={["trained alone", "equal weights", "GradNorm"]} />
          <div className="small dim mono" style={{ marginTop: 6 }}>
            final: alone {fmt(data.a2.l2[STEPS - 1])} · equal {fmt(data.eq.l2[STEPS - 1])} · gradnorm {fmt(data.gn.l2[STEPS - 1])}
          </div>
        </PanelBox>
        <PanelBox title="(c) the knobs GradNorm turns (w₁ + w₂ = 2 always)">
          <Chart series={[data.gn.w1, data.gn.w2]} yLabel="weight" colors={["#c6a1ce", "#aaf7b3"]} labels={["w₁ quiet task", "w₂ loud task"]} />
          <div className="small dim mono" style={{ marginTop: 6 }}>
            w₁: {data.gn.w1[STEPS - 1].toFixed(2)} · w₂: {data.gn.w2[STEPS - 1].toFixed(2)}
          </div>
        </PanelBox>
        <PanelBox title="(d) the loudness gap ‖G₂‖/‖G₁‖ — the mechanism itself">
          <Chart series={[data.eq.gap, data.gn.gap]} logY yLabel="ratio" colors={["#f0927e", "#c6a1ce"]} labels={["equal weights", "GradNorm"]} />
          <div className="small dim mono" style={{ marginTop: 6 }}>
            final: {data.eq.gap[STEPS - 1].toFixed(0)}:1 vs {data.gn.gap[STEPS - 1].toFixed(1)}:1
          </div>
        </PanelBox>
      </div>
    </div>
  );
}
