import { useEffect, useMemo, useState } from "react";

const PINK = "#c6a1ce", GREEN = "#aaf7b3", GOLD = "#e9b949", RED = "#f0927e", DIM = "rgba(203,198,185,.55)";

/* ---------- Figure 13: joint batches vs round robin ---------- */
export function BatchingWidget() {
  const [mode, setMode] = useState<"joint" | "robin">("joint");
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(true);
  const NSTEPS = 8, SLOTS = 16;

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setStep((s) => (s + 1) % NSTEPS), 900);
    return () => clearInterval(id);
  }, [play]);

  const taskOf = (s: number, j: number) => (mode === "joint" ? (j % 2 === 0 ? 0 : 1) : s % 2);

  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: GOLD }}>Figure 13 · what your batch layout does to the algorithms</div>
      <div className="flex gap-2" style={{ margin: "4px 0 10px" }}>
        <button className={`btn ${mode === "joint" ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, padding: "0 14px" }} onClick={() => { setMode("joint"); setStep(0); }}>
          Joint batch
        </button>
        <button className={`btn ${mode === "robin" ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, padding: "0 14px" }} onClick={() => { setMode("robin"); setStep(0); }}>
          Round robin
        </button>
        <button className="btn btn-ghost" style={{ minHeight: 44, padding: "0 14px" }} onClick={() => setPlay(!play)}>
          {play ? "Pause" : "Play"}
        </button>
      </div>
      <div className="flex gap-2" style={{ overflowX: "auto", paddingBottom: 4 }}>
        {Array.from({ length: NSTEPS }, (_, s) => (
          <div key={s} style={{ flex: "0 0 auto", opacity: s === step ? 1 : 0.35, transition: "opacity .3s" }}>
            <div className="small mono" style={{ color: DIM, textAlign: "center", marginBottom: 3 }}>t{s + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 10px)", gap: 2, padding: 5, borderRadius: 8, border: `1px solid ${s === step ? GOLD : "rgba(203,198,185,.15)"}` }}>
              {Array.from({ length: SLOTS }, (_, j) => (
                <div key={j} style={{ width: 10, height: 10, borderRadius: 2, background: taskOf(s, j) === 0 ? PINK : GREEN }} />
              ))}
            </div>
            <div className="small" style={{ textAlign: "center", marginTop: 3, color: DIM }}>
              {mode === "joint" ? "2 voices" : "1 voice"}
            </div>
          </div>
        ))}
      </div>
      <div className="small dim" style={{ marginTop: 8 }}>
        <span style={{ color: PINK }}>■</span> task 1 &nbsp; <span style={{ color: GREEN }}>■</span> task 2.{" "}
        <strong style={{ color: "var(--lighter)" }}>Try this:</strong> toggle between the two layouts.{" "}
        {mode === "joint"
          ? "Every step carries both voices at the same weights — so the question “are the gradients fighting right now?” has an answer, and PCGrad/CAGrad have something to act on."
          : "One voice per step: there is never a pair of gradients to compare, so every combining method silently becomes plain SGD on one task. Takeaway: round robin removes the diagnostic, not the disease — the conflict turns into zigzag across time."}
      </div>
    </div>
  );
}

/* ---------- Figure 14: the frozen-head test ---------- */
export function FrozenHeadTest() {
  const [scn, setScn] = useState<"head" | "backbone">("head");
  const [stage, setStage] = useState(0);
  const target = 0.9;
  // metric values per stage: [baseline MTL, frozen-head fine-tune, after admitting the loss]
  const vals =
    scn === "head"
      ? [0.72, 0.93, null]
      : [0.72, 0.74, 0.91];
  const stages = [
    { t: "1 · Baseline multitask", d: "Train with one loss per task. The task sits at 0.72 against a target of 0.90." },
    { t: "2 · Freeze the backbone, fine-tune the head", d: scn === "head" ? "The team fine-tunes its own head with its full private loss stack — and reaches 0.93." : "Even with every private loss, the head stalls at 0.74." },
    scn === "head"
      ? { t: "3 · Verdict: keep the extra losses private", d: "The backbone already learned what the task needed. The extra losses belong to the head, not to shared training." }
      : { t: "3 · Verdict: the backbone is missing something", d: "No head can fix features the trunk never learned. Admit the one missing loss into multitask training and re-run: 0.91." },
  ];
  const bars = [
    { label: "multitask baseline", v: vals[0]!, color: PINK },
    { label: "frozen-head fine-tune", v: vals[1]!, color: GREEN },
    ...(vals[2] != null ? [{ label: "after admitting the loss", v: vals[2], color: GOLD }] : []),
  ];
  const W = 520, H = 170, base = H - 30;
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: GOLD }}>Figure 14 · the frozen-head test, step by step</div>
      <div className="flex gap-2" style={{ margin: "4px 0 10px", flexWrap: "wrap" }}>
        <button className={`btn ${scn === "head" ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, padding: "0 12px" }} onClick={() => { setScn("head"); setStage(0); }}>
          Scenario A: head-level loss
        </button>
        <button className={`btn ${scn === "backbone" ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, padding: "0 12px" }} onClick={() => { setScn("backbone"); setStage(0); }}>
          Scenario B: backbone-level loss
        </button>
        {stages.map((_, i) => (
          <button key={i} className={`btn ${stage === i ? "btn-gold" : "btn-ghost"}`} style={{ minHeight: 44, minWidth: 44 }} onClick={() => setStage(i)}>
            {i + 1}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 520 }}>
        <line x1={40} y1={base} x2={W - 10} y2={base} stroke="rgba(203,198,185,.25)" />
        <line x1={40} y1={base - target * 120} x2={W - 10} y2={base - target * 120} stroke={GOLD} strokeDasharray="4 5" />
        <text x={44} y={base - target * 120 - 5} fontSize={10} fill={GOLD}>target {target.toFixed(2)}</text>
        {bars.map((b, i) => {
          const shown = stage >= (i === 0 ? 0 : i === 1 ? 1 : 2);
          const h = shown ? b.v * 120 : 0;
          const x = 70 + i * 150;
          return (
            <g key={b.label}>
              <rect x={x} y={base - h} width={80} height={h} fill={b.color} rx={4} style={{ transition: "all .6s" }} />
              <text x={x + 40} y={base - h - 6} textAnchor="middle" fontSize={11} fill="var(--lighter)" className="mono">{shown ? b.v.toFixed(2) : "…"}</text>
              <text x={x + 40} y={base + 14} textAnchor="middle" fontSize={9} fill={DIM}>{b.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="small" style={{ marginTop: 6, color: "var(--lighter)", fontWeight: 600 }}>{stages[stage].t}</div>
      <div className="small dim">{stages[stage].d}</div>
    </div>
  );
}

/* ---------- Figure 15: more losses, more directions to appease ---------- */
export function LossStackLandscape() {
  const [k, setK] = useState(4);
  const [seed, setSeed] = useState(1);
  const W = 460, H = 320, cx = W / 2, cy = H / 2, S = 46;

  const dirs = useMemo(() => {
    // deterministic pseudo-random unit-ish vectors
    const out: { x: number; y: number }[] = [];
    let s = seed * 7919;
    const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let i = 0; i < k; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 0.7 + rnd() * 0.9;
      out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return out;
  }, [k, seed]);

  // min-norm point in convex hull (Frank-Wolfe, 80 iters)
  const blend = useMemo(() => {
    let w = dirs.map(() => 1 / dirs.length);
    const combo = (ww: number[]) => ({
      x: ww.reduce((s, wi, i) => s + wi * dirs[i].x, 0),
      y: ww.reduce((s, wi, i) => s + wi * dirs[i].y, 0),
    });
    for (let it = 0; it < 80; it++) {
      const c = combo(w);
      let bi = 0, bd = Infinity;
      dirs.forEach((d, i) => { const dd = d.x * c.x + d.y * c.y; if (dd < bd) { bd = dd; bi = i; } });
      const g = 2 / (it + 2);
      w = w.map((wi, i) => (1 - g) * wi + (i === bi ? g : 0));
    }
    return combo(w);
  }, [dirs]);

  const avg = useMemo(() => ({
    x: dirs.reduce((s, d) => s + d.x, 0) / k,
    y: dirs.reduce((s, d) => s + d.y, 0) / k,
  }), [dirs, k]);

  let fights = 0;
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++)
    if (dirs[i].x * dirs[j].x + dirs[i].y * dirs[j].y < 0) fights++;
  const pairs = (k * (k - 1)) / 2;

  const arrows = [
    ...dirs.map((d, i) => ({ ...d, color: `hsl(${40 + (i * 260) / Math.max(k, 1)}, 45%, 68%)`, w: 1.8, key: `g${i}` })),
  ];
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="box-label" style={{ color: GOLD }}>Figure 15 · every loss you add is another direction the trunk must appease</div>
      <div className="flex items-center gap-3 flex-wrap" style={{ margin: "4px 0 8px" }}>
        <span className="small dim" style={{ minWidth: 110 }}>losses in the stack: <strong style={{ color: "var(--lighter)" }}>{k}</strong></span>
        <input type="range" min={2} max={8} step={1} value={k} onChange={(e) => setK(parseInt(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
        <button className="btn btn-ghost" style={{ minHeight: 44, padding: "0 14px" }} onClick={() => setSeed(seed + 1)}>Shuffle directions</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 520 }}>
        {/* contours of the average loss, centered at the blend */}
        {[2.2, 1.6, 1.1, 0.7, 0.4].map((r) => (
          <ellipse key={r} cx={cx - blend.x * S} cy={cy + blend.y * S} rx={r * 90} ry={r * 60} fill="none" stroke="rgba(203,198,185,.12)" strokeWidth={1.2} />
        ))}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke="rgba(203,198,185,.14)" />
        <line x1={cx} y1={0} x2={cx} y2={H} stroke="rgba(203,198,185,.14)" />
        {arrows.map((a) => (
          <g key={a.key}>
            <line x1={cx} y1={cy} x2={cx + a.x * S} y2={cy - a.y * S} stroke={a.color} strokeWidth={a.w} />
            <circle cx={cx + a.x * S} cy={cy - a.y * S} r={4} fill={a.color} />
          </g>
        ))}
        <line x1={cx} y1={cy} x2={cx + avg.x * S * 1.6} y2={cy - avg.y * S * 1.6} stroke={RED} strokeWidth={3.5} />
        <line x1={cx} y1={cy} x2={cx + blend.x * S * 1.6} y2={cy - blend.y * S * 1.6} stroke={GOLD} strokeWidth={3.5} />
        <circle cx={cx} cy={cy} r={4} fill="var(--lighter)" />
        <text x={cx + avg.x * S * 1.6 + 8} y={cy - avg.y * S * 1.6} fontSize={10} fill={RED}>plain average</text>
        <text x={cx + blend.x * S * 1.6 + 8} y={cy - blend.y * S * 1.6} fontSize={10} fill={GOLD}>min-norm blend</text>
      </svg>
      <div className="flex gap-3 flex-wrap" style={{ marginTop: 6 }}>
        <div className="small mono" style={{ color: "var(--lighter)" }}>
          {fights}/{pairs} pairs in conflict
        </div>
        <div className="small dim" style={{ flex: 1, minWidth: 200 }}>
          With {k} losses there are {pairs} pairwise relationships, and the thin red average is usually dragged toward the loudest few. This is the cost the paper warns about: each extra loss is paid by <em>every</em> team's trunk. Bring fewer, better losses.
        </div>
      </div>
    </div>
  );
}
