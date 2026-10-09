import { useState } from "react";

type Node =
  | { kind: "q"; text: string; yes: string; no: string }
  | { kind: "r"; text: string; detail: string };

const NODES: Record<string, Node> = {
  start: {
    kind: "q",
    text: "Do gradient norms differ by orders of magnitude?",
    yes: "scale",
    no: "cosines",
  },
  scale: {
    kind: "q",
    text: "Scale problem. Reweight with GradNorm (or uncertainty weighting). Does conflict persist after reweighting?",
    yes: "combine",
    no: "ship",
  },
  combine: {
    kind: "r",
    text: "Combine: GradNorm weights + PCGrad/CAGrad surgery",
    detail:
      "The two families are teammates: reweighting fixes how loud tasks are, surgery fixes the direction they pull. Feeding GradNorm's weights into PCGrad's cuts is a common, proven combination.",
  },
  ship: {
    kind: "r",
    text: "Ship it",
    detail: "Reweighting alone resolved it. Keep the cosine log running so you notice if the conflict comes back.",
  },
  cosines: {
    kind: "q",
    text: "Are gradient cosines often negative between task pairs?",
    yes: "needproof",
    no: "fine",
  },
  fine: {
    kind: "r",
    text: "Equal weights are probably fine",
    detail: "No scale gap, no direction fights. Train on the plain sum, but keep logging — balance can drift as tasks finish at different speeds.",
  },
  needproof: {
    kind: "q",
    text: "Do you need reproducible, objective-faithful convergence?",
    yes: "cagrad",
    no: "pcgrad",
  },
  cagrad: {
    kind: "r",
    text: "CAGrad, c ≈ 0.2–0.4",
    detail:
      "Maximizes the worst-off task's improvement inside a ball around the average gradient, with a proof that the average loss keeps falling. Consistent across random seeds.",
  },
  pcgrad: {
    kind: "r",
    text: "PCGrad",
    detail:
      "Cheapest conflict fix to try: no knobs, wraps any optimizer. Cut each gradient's shadow on any task it fights, then sum.",
  },
};

export default function Flowchart() {
  const [path, setPath] = useState<string[]>(["start"]);
  const cur = NODES[path[path.length - 1]];

  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.14)" }}>
      <div className="box-label" style={{ color: "var(--gold)" }}>Decision flowchart · click to walk it</div>
      {path.slice(0, -1).map((id, i) => {
        const n = NODES[id];
        const answer = NODES[path[i + 1]] && (n.kind === "q" ? (n.yes === path[i + 1] ? "yes" : "no") : "");
        return (
          <div key={i} className="small dim" style={{ padding: "4px 0", borderBottom: "1px dashed rgba(203,198,185,.12)" }}>
            {n.kind === "q" ? n.text : n.text} → <span style={{ color: "var(--gold)" }}>{answer}</span>
          </div>
        );
      })}
      <div style={{ marginTop: 14 }}>
        {cur.kind === "q" ? (
          <>
            <div style={{ color: "var(--lighter)", fontSize: 17, fontWeight: 600, marginBottom: 14 }}>{cur.text}</div>
            <div className="flex gap-3">
              <button className="btn btn-gold" onClick={() => setPath([...path, cur.yes])}>Yes</button>
              <button className="btn btn-ghost" onClick={() => setPath([...path, cur.no])}>No</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ color: "var(--gold)", fontSize: 19, fontWeight: 650, marginBottom: 8 }}>{cur.text}</div>
            <p className="small" style={{ marginBottom: 12 }}>{cur.detail}</p>
            <button className="btn btn-ghost" onClick={() => setPath(["start"])}>Start over</button>
          </>
        )}
      </div>
    </div>
  );
}
