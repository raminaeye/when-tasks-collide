import { useEffect, useState } from "react";

const STATIONS = [
  { id: 0, title: "1 · SENSE", color: "#8ab2d1", desc: "Measure each task's gradient norm Gᵢ (how loud is it?) and loss ratio L̃ᵢ (how far along is it?).", x: 110, y: 70 },
  { id: 1, title: "2 · COMPARE", color: "#c0924e", desc: "Set the target: average loudness Ḡ, boosted by [rᵢ]^α for whichever task is behind.", x: 350, y: 70 },
  { id: 2, title: "3 · CORRECT", color: "#8ac1a0", desc: "Nudge the weights by gradient descent on L_grad — louder if too quiet, quieter if too loud.", x: 350, y: 220 },
  { id: 3, title: "4 · RENORMALIZE", color: "#c6a1ce", desc: "Rescale so the weights sum to K — a fixed budget of attention — and go around again.", x: 110, y: 220 },
];

export default function ThermostatLoop() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((a) => (a + 1) % 4), 1800);
    return () => clearInterval(id);
  }, [auto]);

  const st = STATIONS[active];

  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>Figure 4 · the thermostat loop, live</div>
      <svg viewBox="0 0 460 290" style={{ width: "100%", display: "block" }}>
        {/* arrows between stations */}
        {[
          [215, 70, 245, 70],
          [390, 95, 390, 165],
          [350, 245, 215, 245],
          [70, 215, 70, 95],
        ].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(203,198,185,.4)" strokeWidth={1.5} markerEnd="url(#th-arrow)" />
          </g>
        ))}
        <defs>
          <marker id="th-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(203,198,185,.6)" />
          </marker>
        </defs>
        <text x={230} y={150} textAnchor="middle" fill="rgba(203,198,185,.5)" fontSize={11}>repeat every training step —</text>
        <text x={230} y={166} textAnchor="middle" fill="rgba(203,198,185,.5)" fontSize={11}>the loop re-measures after every correction,</text>
        <text x={230} y={182} textAnchor="middle" fill="rgba(203,198,185,.5)" fontSize={11}>so no lucky initial weights are needed</text>
        {STATIONS.map((s) => (
          <g key={s.id} onClick={() => { setActive(s.id); setAuto(false); }} style={{ cursor: "pointer" }}>
            <rect
              x={s.x - 105} y={s.y - 30} width={210} height={s.id % 2 === 0 ? 60 : 60} rx={12}
              fill={active === s.id ? s.color : "rgba(24,20,18,1)"}
              fillOpacity={active === s.id ? 0.22 : 1}
              stroke={s.color}
              strokeWidth={active === s.id ? 2.5 : 1.2}
              style={{ transition: "all .4s var(--ease)" }}
            />
            <text x={s.x} y={s.y - 8} textAnchor="middle" fill={s.color} fontSize={13} fontWeight={700} letterSpacing={1}>{s.title}</text>
            <text x={s.x} y={s.y + 12} textAnchor="middle" fill="rgba(203,198,185,.75)" fontSize={10.5}>
              {s.id === 0 ? "how loud? how far along?" : s.id === 1 ? "target = avg loudness × boost" : s.id === 2 ? "nudge the weights" : "weights sum to K, always"}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ minHeight: 44 }}>
        <span className="small" style={{ color: st.color, fontWeight: 600 }}>{st.title}: </span>
        <span className="small dim">{st.desc}</span>
      </div>
      <div className="flex gap-2" style={{ marginTop: 8 }}>
        <button className="btn btn-ghost" style={{ minHeight: 44, padding: "0 16px" }} onClick={() => { setAuto(false); setActive((active + 1) % 4); }}>
          Step →
        </button>
        <button className={`btn ${auto ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, padding: "0 16px" }} onClick={() => setAuto(!auto)}>
          {auto ? "Playing" : "Play loop"}
        </button>
      </div>
    </div>
  );
}
