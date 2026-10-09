import { useMemo, useRef, useState } from "react";

type V = { x: number; y: number };
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
const sub = (a: V, b: V) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: V, b: V) => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: V, s: number) => ({ x: a.x * s, y: a.y * s });
const norm = (a: V) => Math.hypot(a.x, a.y);
const SCALE = 46; // px per unit
const MAXR = 4.6;

type Method = "gd" | "pcgrad" | "mgda" | "cagrad";

const PRESETS: { name: string; g1: V; g2: V }[] = [
  { name: "Paper §5: (3,1) vs (−1,2)", g1: { x: 3, y: 1 }, g2: { x: -1, y: 2 } },
  { name: "Loud vs quiet", g1: { x: 3, y: 1 }, g2: { x: -1.5, y: 0.5 } },
  { name: "Allies (no conflict)", g1: { x: 2, y: 1.4 }, g2: { x: 1.2, y: 2 } },
  { name: "Head-on fight", g1: { x: 3, y: 0.6 }, g2: { x: -2.8, y: -0.4 } },
];

function pcgrad(g1: V, g2: V): [V, V] {
  if (dot(g1, g2) >= 0) return [g1, g2];
  const a = dot(g1, g2) / dot(g2, g2);
  const b = dot(g2, g1) / dot(g1, g1);
  return [sub(g1, scale(g2, a)), sub(g2, scale(g1, b))];
}

function mgdaW(g1: V, g2: V): number {
  const d = sub(g1, g2);
  const denom = dot(d, d);
  if (denom < 1e-9) return 0.5;
  const e = sub(g2, g1); // g2 - g1: min-norm weight is <g2, g2-g1> / ||g1-g2||^2
  return Math.min(1, Math.max(0, dot(g2, e) / denom));
}

function cagradD(g1: V, g2: V, c: number): V {
  const g0 = scale(add(g1, g2), 0.5);
  const n0 = norm(g0);
  if (n0 < 1e-9 || c < 1e-9) return g0;
  let bestW = 0.5;
  let bestF = Infinity;
  for (let i = 0; i <= 400; i++) {
    const w = i / 400;
    const gw = add(scale(g1, w), scale(g2, 1 - w));
    const f = dot(gw, g0) + c * n0 * norm(gw);
    if (f < bestF) {
      bestF = f;
      bestW = w;
    }
  }
  const gw = add(scale(g1, bestW), scale(g2, 1 - bestW));
  const ngw = norm(gw);
  if (ngw < 1e-9) return g0;
  // official 1/(1+c) normalization, matching the paper's reference code (as in the racer)
  return scale(add(g0, scale(gw, (c * n0) / ngw)), 1 / (1 + c));
}

export default function GradientPlayground() {
  const [g1, setG1] = useState<V>({ x: 3, y: 1 });
  const [g2, setG2] = useState<V>({ x: -1, y: 2 });
  const [method, setMethod] = useState<Method>("gd");
  const [c, setC] = useState(0.5);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTarget = useRef<1 | 2 | null>(null);

  const g0 = useMemo(() => scale(add(g1, g2), 0.5), [g1, g2]);
  const conflict = dot(g1, g2) < 0;
  const cos = dot(g1, g2) / Math.max(1e-9, norm(g1) * norm(g2));

  const { d, cuts } = useMemo(() => {
    if (method === "gd") return { d: add(g1, g2), cuts: null as [V, V] | null };
    if (method === "pcgrad") {
      const [a, b] = pcgrad(g1, g2);
      return { d: add(a, b), cuts: [a, b] as [V, V] };
    }
    if (method === "mgda") {
      const w = mgdaW(g1, g2);
      return { d: add(scale(g1, w), scale(g2, 1 - w)), cuts: null };
    }
    return { d: cagradD(g1, g2, c), cuts: null };
  }, [g1, g2, method, c]);

  const s1 = dot(d, g1);
  const s2 = dot(d, g2);

  function toWorld(e: React.PointerEvent): V {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width - 0.5) * (500 / SCALE),
      y: -(((e.clientY - r.top) / r.height - 0.5) * (500 / SCALE)),
    };
  }
  function onMove(e: React.PointerEvent) {
    if (!dragTarget.current) return;
    let p = toWorld(e);
    const n = norm(p);
    if (n > MAXR) p = scale(p, MAXR / n);
    if (n < 0.25) p = scale(p, 0.25 / Math.max(n, 1e-6));
    const setter = dragTarget.current === 1 ? setG1 : setG2;
    setter({ x: Math.round(p.x * 20) / 20, y: Math.round(p.y * 20) / 20 });
  }

  const px = (v: V) => ({ cx: 250 + v.x * SCALE, cy: 250 - v.y * SCALE });

  function Arrow({ v, color, width = 3, dash, opacity = 1 }: { v: V; color: string; width?: number; dash?: string; opacity?: number }) {
    const p = px(v);
    return (
      <g opacity={opacity}>
        <line x1={250} y1={250} x2={p.cx} y2={p.cy} stroke={color} strokeWidth={width} strokeDasharray={dash} markerEnd={`url(#ah-${color.replace("#", "")})`} />
      </g>
    );
  }

  // betrayal half-planes: shade the side where <d, gi> < 0
  function DangerZone({ g, color }: { g: V; color: string }) {
    const n = norm(g);
    if (n < 1e-6) return null;
    const u = scale(g, 1 / n); // unit toward g
    const perp = { x: -u.y, y: u.x };
    const c1 = px(scale(perp, 5));
    const c2 = px({ x: perp.x * 5 - u.x * 5.2, y: perp.y * 5 - u.y * 5.2 });
    const c3 = px({ x: -perp.x * 5 - u.x * 5.2, y: -perp.y * 5 - u.y * 5.2 });
    const c4 = px(scale(perp, -5));
    return (
      <polygon
        points={`${c1.cx},${c1.cy} ${c2.cx},${c2.cy} ${c3.cx},${c3.cy} ${c4.cx},${c4.cy}`}
        fill={color}
        opacity={0.07}
      />
    );
  }

  const pD = px(d);
  const pG0 = px(g0);
  const ballR = c * norm(g0) * SCALE;

  return (
    <div>
      <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
        {(
          [
            ["gd", "Plain sum (GD)"],
            ["pcgrad", "PCGrad"],
            ["mgda", "MGDA"],
            ["cagrad", "CAGrad"],
          ] as [Method, string][]
        ).map(([m, label]) => (
          <button key={m} className={`btn btn-ghost ${method === m ? "on" : ""}`} onClick={() => setMethod(m)} style={{ minHeight: 44, padding: "0 16px" }}>
            {label}
          </button>
        ))}
      </div>

      {method === "cagrad" && (
        <div style={{ margin: "4px 0 10px" }}>
          <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>leash length c</span>
            <span className="mono" style={{ color: "var(--cagrad)" }}>{c.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1.5} step={0.05} value={c} onChange={(e) => setC(+e.target.value)} />
        </div>
      )}

      <div style={{ background: "var(--bg-tinted)", borderRadius: 14, border: "1px solid rgba(203,198,185,.12)", overflow: "hidden" }}>
        <svg
          ref={svgRef}
          viewBox="0 0 500 500"
          style={{ width: "100%", display: "block", touchAction: "none", cursor: dragTarget.current ? "grabbing" : "default" }}
          onPointerMove={onMove}
          onPointerUp={() => (dragTarget.current = null)}
          onPointerLeave={() => (dragTarget.current = null)}
        >
          <defs>
            {["c6a1ce", "aaf7b3", "c0924e", "e9e7e2"].map((h) => (
              <marker key={h} id={`ah-${h}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={`#${h}`} />
              </marker>
            ))}
          </defs>

          {/* grid */}
          {Array.from({ length: 9 }, (_, i) => (i - 4) * SCALE + 250).map((p) => (
            <g key={p} stroke="rgba(203,198,185,.08)" strokeWidth={1}>
              <line x1={p} y1={0} x2={p} y2={500} />
              <line x1={0} y1={p} x2={500} y2={p} />
            </g>
          ))}
          <line x1={0} y1={250} x2={500} y2={250} stroke="rgba(203,198,185,.2)" />
          <line x1={250} y1={0} x2={250} y2={500} stroke="rgba(203,198,185,.2)" />

          <DangerZone g={g1} color="#c6a1ce" />
          <DangerZone g={g2} color="#aaf7b3" />

          {method === "cagrad" && c > 0 && (
            <circle cx={pG0.cx} cy={pG0.cy} r={ballR} fill="none" stroke="#efedbd" strokeWidth={1.5} strokeDasharray="5 6" opacity={0.7} />
          )}
          {method === "cagrad" && <Arrow v={g0} color="#e9e7e2" width={1.5} dash="4 5" opacity={0.6} />}

          {cuts && (
            <>
              <Arrow v={cuts[0]} color="#c6a1ce" width={1.6} dash="5 5" opacity={0.85} />
              <Arrow v={cuts[1]} color="#aaf7b3" width={1.6} dash="5 5" opacity={0.85} />
            </>
          )}

          <Arrow v={d} color="#c0924e" width={4} />
          <Arrow v={g1} color="#c6a1ce" />
          <Arrow v={g2} color="#aaf7b3" />

          {/* handles */}
          {([{ g: g1, set: 1 as const, c: "#c6a1ce" }, { g: g2, set: 2 as const, c: "#aaf7b3" }]).map(({ g, set, c: col }) => {
            const p = px(g);
            return (
              <circle
                key={set}
                cx={p.cx}
                cy={p.cy}
                r={16}
                fill={col}
                fillOpacity={0.35}
                stroke={col}
                strokeWidth={2}
                style={{ cursor: "grab", touchAction: "none" }}
                onPointerDown={(e) => {
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  dragTarget.current = set;
                }}
              />
            );
          })}
          {/* endpoint marker of d */}
          <circle cx={pD.cx} cy={pD.cy} r={4} fill="#c0924e" />
        </svg>
      </div>

      {/* readouts */}
      <div className="grid grid-cols-2 gap-2" style={{ marginTop: 12 }}>
        <div className="box" style={{ margin: 0, background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)", padding: "12px 14px" }}>
          <div className="small dim">g₁ (drag the pink handle)</div>
          <div className="mono" style={{ color: "#c6a1ce" }}>({g1.x.toFixed(1)}, {g1.y.toFixed(1)})</div>
          <div className="small dim" style={{ marginTop: 6 }}>score ⟨d, g₁⟩</div>
          <div className="mono" style={{ color: s1 >= 0 ? "var(--pcgrad)" : "var(--danger)", fontSize: 17 }}>
            {s1.toFixed(2)} {s1 >= 0 ? "· helped" : "· HURT"}
          </div>
        </div>
        <div className="box" style={{ margin: 0, background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)", padding: "12px 14px" }}>
          <div className="small dim">g₂ (drag the green handle)</div>
          <div className="mono" style={{ color: "#aaf7b3" }}>({g2.x.toFixed(1)}, {g2.y.toFixed(1)})</div>
          <div className="small dim" style={{ marginTop: 6 }}>score ⟨d, g₂⟩</div>
          <div className="mono" style={{ color: s2 >= 0 ? "var(--pcgrad)" : "var(--danger)", fontSize: 17 }}>
            {s2.toFixed(2)} {s2 >= 0 ? "· helped" : "· HURT"}
          </div>
        </div>
      </div>

      <p className="small dim" style={{ marginTop: 12 }}>
        cos∠(g₁, g₂) = <span className="mono" style={{ color: conflict ? "var(--danger)" : "var(--pcgrad)" }}>{cos.toFixed(2)}</span>
        {" — "}{conflict ? "the gradients are fighting (cos < 0)." : "no conflict right now (cos ≥ 0)."}
        {" "}The shaded half-planes are betrayal zones: any update arrow ending inside the pink zone hurts task 1, inside the green zone hurts task 2. The gold arrow is the update d.
      </p>

      <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            className="btn btn-ghost"
            style={{ minHeight: 44, padding: "0 14px", fontSize: 12 }}
            onClick={() => {
              setG1(p.g1);
              setG2(p.g2);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
