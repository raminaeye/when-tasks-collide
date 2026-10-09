import { useRef, useState } from "react";

type V = { x: number; y: number };
const SCALE = 34;

function useDrag(onMove: (v: V) => void, w: number, h: number) {
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  return {
    ref,
    onPointerDown: (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragging.current || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      let x = ((e.clientX - r.left) / r.width - 0.5) * (w / SCALE);
      let y = -(((e.clientY - r.top) / r.height - 0.55) * (h / SCALE));
      const n = Math.hypot(x, y);
      const max = 3.6;
      if (n > max) { x *= max / n; y *= max / n; }
      onMove({ x, y });
    },
    onPointerUp: () => (dragging.current = false),
  };
}

function Panel({ title, children, foot }: { title: string; children: React.ReactNode; foot: React.ReactNode }) {
  return (
    <div className="box" style={{ margin: 0, background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>{title}</div>
      {children}
      <div className="small dim" style={{ marginTop: 8 }}>{foot}</div>
    </div>
  );
}

function Axes({ w, h }: { w: number; h: number }) {
  return (
    <g stroke="rgba(203,198,185,.18)">
      <line x1={0} y1={h * 0.55} x2={w} y2={h * 0.55} />
      <line x1={w / 2} y1={0} x2={w / 2} y2={h} />
    </g>
  );
}

// (a) vector + norm
export function VectorPanel() {
  const [v, setV] = useState<V>({ x: 3, y: 1 });
  const d = useDrag(setV, 260, 170);
  const n = Math.hypot(v.x, v.y);
  const W = 260, H = 170;
  const cx = W / 2, cy = H * 0.55;
  return (
    <Panel title="(a) a vector is an arrow" foot={<>norm ‖v‖ = √(vₓ² + v_y²) = <strong style={{ color: "var(--lighter)" }}>{n.toFixed(2)}</strong> — "loud" means this number is large. Drag the arrowhead.</>}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", touchAction: "none", cursor: "grab" }} {...d}>
        <Axes w={W} h={H} />
        <line x1={cx} y1={cy} x2={cx + v.x * SCALE} y2={cy - v.y * SCALE} stroke="#8ab2d1" strokeWidth={3} />
        <line x1={cx} y1={cy} x2={cx + v.x * SCALE} y2={cy} stroke="rgba(203,198,185,.4)" strokeDasharray="3 4" />
        <line x1={cx + v.x * SCALE} y1={cy} x2={cx + v.x * SCALE} y2={cy - v.y * SCALE} stroke="rgba(203,198,185,.4)" strokeDasharray="3 4" />
        <circle cx={cx + v.x * SCALE} cy={cy - v.y * SCALE} r={9} fill="#8ab2d1" fillOpacity={0.4} stroke="#8ab2d1" strokeWidth={2} />
        <text x={Math.min(cx + v.x * SCALE + 14, W - 104)} y={cy - v.y * SCALE - 14} fill="#8ab2d1" fontSize={11} className="mono">
          v = ({v.x.toFixed(1)}, {v.y.toFixed(1)})
        </text>
      </svg>
    </Panel>
  );
}

// (b) dot product agreement meter
export function DotPanel() {
  const [v, setV] = useState<V>({ x: -1, y: 2 });
  const u = { x: 3, y: 1 };
  const d = useDrag(setV, 260, 170);
  const dot = u.x * v.x + u.y * v.y;
  const cos = dot / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) || 1);
  const W = 260, H = 170;
  const cx = W / 2, cy = H * 0.55;
  return (
    <Panel title="(b) the dot product is an agreement meter" foot={<>⟨u,v⟩ = <strong style={{ color: dot >= 0 ? "var(--pcgrad)" : "var(--danger)" }}>{dot.toFixed(2)}</strong>, cos = {cos.toFixed(2)} — {cos > 0.05 ? "pulling together" : cos < -0.05 ? "conflict" : "perpendicular, indifferent"}.</>}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", touchAction: "none", cursor: "grab" }} {...d}>
        <Axes w={W} h={H} />
        <line x1={cx} y1={cy} x2={cx + u.x * SCALE} y2={cy - u.y * SCALE} stroke="#c6a1ce" strokeWidth={2.5} />
        <line x1={cx} y1={cy} x2={cx + v.x * SCALE} y2={cy - v.y * SCALE} stroke="#aaf7b3" strokeWidth={2.5} />
        <circle cx={cx + v.x * SCALE} cy={cy - v.y * SCALE} r={9} fill="#aaf7b3" fillOpacity={0.4} stroke="#aaf7b3" strokeWidth={2} />
        <text x={Math.min(cx + u.x * SCALE + 10, W - 58)} y={cy - u.y * SCALE - 12} fill="#c6a1ce" fontSize={11}>u (fixed)</text>
        <text x={Math.min(cx + v.x * SCALE + 12, W - 20)} y={cy - v.y * SCALE - 12} fill="#aaf7b3" fontSize={11}>v</text>
      </svg>
    </Panel>
  );
}

// (c) projection shadow
export function ProjectionPanel() {
  const [g1, setG1] = useState<V>({ x: 3, y: 1 });
  const g2 = { x: -1, y: 2 };
  const d = useDrag(setG1, 260, 170);
  const dot12 = g1.x * g2.x + g1.y * g2.y;
  const n2sq = g2.x * g2.x + g2.y * g2.y;
  const t = dot12 / n2sq;
  const shadow = { x: t * g2.x, y: t * g2.y };
  const left = { x: g1.x - shadow.x, y: g1.y - shadow.y };
  const W = 260, H = 170;
  const cx = W / 2, cy = H * 0.55;
  const px = (v: V) => ({ cx: cx + v.x * SCALE, cy: cy - v.y * SCALE });
  return (
    <Panel title="(c) projection is casting a shadow" foot={<>shadow = (⟨g₁,g₂⟩/‖g₂‖²)·g₂ = ({shadow.x.toFixed(2)}, {shadow.y.toFixed(2)}). What's left after removing it is <strong style={{ color: "var(--lighter)" }}>perpendicular to g₂</strong> — dot check: {(left.x * g2.x + left.y * g2.y).toFixed(2)}. This subtraction is all of PCGrad.</>}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", touchAction: "none", cursor: "grab" }} {...d}>
        <Axes w={W} h={H} />
        {/* g2's line, extended */}
        <line x1={px({ x: g2.x * 1.8, y: g2.y * 1.8 }).cx} y1={px({ x: g2.x * 1.8, y: g2.y * 1.8 }).cy} x2={px({ x: -g2.x * 1.8, y: -g2.y * 1.8 }).cx} y2={px({ x: -g2.x * 1.8, y: -g2.y * 1.8 }).cy} stroke="rgba(170,247,179,.25)" strokeDasharray="3 5" />
        <line x1={cx} y1={cy} x2={px(g2).cx} y2={px(g2).cy} stroke="#aaf7b3" strokeWidth={2.5} />
        <line x1={cx} y1={cy} x2={px(g1).cx} y2={px(g1).cy} stroke="#c6a1ce" strokeWidth={2.5} />
        {/* shadow */}
        <line x1={cx} y1={cy} x2={px(shadow).cx} y2={px(shadow).cy} stroke="#f0927e" strokeWidth={4} strokeOpacity={0.8} />
        {/* drop line from g1 tip to shadow tip */}
        <line x1={px(g1).cx} y1={px(g1).cy} x2={px(shadow).cx} y2={px(shadow).cy} stroke="rgba(203,198,185,.5)" strokeDasharray="3 3" />
        {/* leftover from shadow tip to g1 tip is perpendicular */}
        <circle cx={px(g1).cx} cy={px(g1).cy} r={9} fill="#c6a1ce" fillOpacity={0.4} stroke="#c6a1ce" strokeWidth={2} />
        <text x={px(g2).cx - 26} y={px(g2).cy - 10} fill="#aaf7b3" fontSize={11}>g₂</text>
        <text x={Math.min(px(g1).cx + 13, W - 24)} y={px(g1).cy - 13} fill="#c6a1ce" fontSize={11}>g₁</text>
        <text x={Math.min(px(shadow).cx + 6, W - 48)} y={px(shadow).cy + 16} fill="#f0927e" fontSize={10}>shadow</text>
      </svg>
    </Panel>
  );
}

// (d) gradient as uphill compass on a contour hill
export function GradientPanel() {
  const [p, setP] = useState<V>({ x: 1.4, y: -0.8 });
  const W = 260, H = 170;
  // hill: L = x^2 + 2y^2
  const L = (x: number, y: number) => x * x + 2 * y * y;
  const ref = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const move = (e: React.PointerEvent) => {
    if (!dragging.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 7;
    const y = -(((e.clientY - r.top) / r.height) - 0.5) * 4.6;
    setP({ x, y });
  };
  const grad = { x: 2 * p.x, y: 4 * p.y };
  const gn = Math.hypot(grad.x, grad.y) || 1;
  const gshow = { x: (grad.x / gn) * 1.1, y: (grad.y / gn) * 1.1 };
  const cx = W / 2, cy = H / 2;
  const px = (v: V) => ({ cx: cx + v.x * 34, cy: cy - v.y * 34 });
  const rings = [0.4, 1, 2, 3.2, 4.6, 6.2];
  return (
    <Panel title="(d) the gradient is an uphill compass" foot={<>drag the point. The red arrow ∇L points straight uphill, the gold arrow −∇L is the training step. Right now L = <strong style={{ color: "var(--lighter)" }}>{L(p.x, p.y).toFixed(2)}</strong>.</>}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", touchAction: "none", cursor: "grab" }}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); move(e); }}
        onPointerMove={move}
        onPointerUp={() => (dragging.current = false)}
      >
        {rings.map((r) => (
          <ellipse key={r} cx={cx} cy={cy} rx={r * 34 / Math.SQRT2} ry={r * 34 / 2} fill="none" stroke="rgba(203,198,185,.22)" />
        ))}
        <line x1={px(p).cx} y1={px(p).cy} x2={px({ x: p.x + gshow.x, y: p.y + gshow.y }).cx} y2={px({ x: p.x + gshow.x, y: p.y + gshow.y }).cy} stroke="#f0927e" strokeWidth={2.5} />
        <line x1={px(p).cx} y1={px(p).cy} x2={px({ x: p.x - gshow.x, y: p.y - gshow.y }).cx} y2={px({ x: p.x - gshow.x, y: p.y - gshow.y }).cy} stroke="#c0924e" strokeWidth={2.5} />
        <circle cx={px(p).cx} cy={px(p).cy} r={8} fill="#e9e7e2" fillOpacity={0.3} stroke="#e9e7e2" strokeWidth={2} />
        <text x={px({ x: p.x + gshow.x, y: p.y + gshow.y }).cx + 4} y={px({ x: p.x + gshow.x, y: p.y + gshow.y }).cy} fill="#f0927e" fontSize={10}>∇L uphill</text>
        <text x={px({ x: p.x - gshow.x, y: p.y - gshow.y }).cx + 4} y={px({ x: p.x - gshow.x, y: p.y - gshow.y }).cy + 10} fill="#c0924e" fontSize={10}>−∇L the step</text>
      </svg>
    </Panel>
  );
}

export function MathPanelsGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-3" style={{ margin: "20px 0" }}>
      <VectorPanel />
      <DotPanel />
      <ProjectionPanel />
      <GradientPanel />
    </div>
  );
}
