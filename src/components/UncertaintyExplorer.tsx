import { useState } from "react";

const TASKS = [
  { name: "Task 1", color: "#c6a1ce" },
  { name: "Task 2", color: "#aaf7b3" },
  { name: "Task 3", color: "#8ab2d1" },
];

export default function UncertaintyExplorer() {
  const [sig, setSig] = useState([0.7, 1.5, 2.4]);
  const weights = sig.map((s) => 1 / (2 * s * s));
  const total = weights.reduce((a, b) => a + b, 0);

  return (
    <div>
      {TASKS.map((t, i) => (
        <div key={t.name} style={{ marginBottom: 14 }}>
          <div className="small" style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: t.color }}>{t.name}</span>
            <span className="mono dim">
              sigma = {sig[i].toFixed(2)} · weight 1/(2 sigma^2) = {weights[i].toFixed(2)} · price log sigma = {Math.log(sig[i]).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.05}
            value={sig[i]}
            onChange={(e) => {
              const n = [...sig];
              n[i] = +e.target.value;
              setSig(n);
            }}
          />
        </div>
      ))}
      <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
        <div className="small dim" style={{ marginBottom: 8 }}>Share of the total loss (who gets heard)</div>
        <div style={{ display: "flex", height: 26, borderRadius: 6, overflow: "hidden" }}>
          {weights.map((w, i) => (
            <div
              key={i}
              style={{
                width: `${(100 * w) / total}%`,
                background: TASKS[i].color,
                transition: "width .3s var(--ease)",
              }}
              title={`${TASKS[i].name}: ${((100 * w) / total).toFixed(0)}%`}
            />
          ))}
        </div>
        <div className="small dim" style={{ marginTop: 8 }}>
          Drag the sliders: a task twice as noisy gets four times less weight. Watch the log price too — pushing sigma to 3 buys quiet, but pays {Math.log(3).toFixed(2)} per task in the objective. The model only pays that price for tasks that are genuinely noisy.
        </div>
      </div>
    </div>
  );
}
