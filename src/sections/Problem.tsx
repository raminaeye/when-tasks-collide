import { useState } from "react";
import { TabHead, Eq, Intuition } from "../components/bits";
import { FailureModesGrid } from "../components/FailureModes";

export default function Problem() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(1);

  return (
    <div className="fadein">
      <TabHead eyebrow="Part I · §2" title="The naive recipe, and three ways it goes wrong">
        The obvious recipe is linear scalarization: add the losses together with some weights, and run
        ordinary gradient descent on the sum.
      </TabHead>

      <Eq caption="K losses, one weighted sum; then one step of gradient descent.">
        L(θ) = <span className="op">∑</span>ᵢ wᵢ Lᵢ(θ) &nbsp;&nbsp;·&nbsp;&nbsp; θ ← θ − α ∇L(θ)
      </Eq>

      <p>
        Symbol by symbol: <strong>θ</strong> ("theta") is all the model's adjustable knobs packed into
        one list. <strong>Lᵢ(θ)</strong> is task i's loss, one number saying how badly the model is doing
        on that task — lower is better. <strong>wᵢ</strong> is a volume knob for task i: wᵢ = 2 makes
        that task count double. The big <strong>∑</strong> just means "add up tasks 1 through K."
        <strong> α</strong> ("alpha") is the step size, a small number like 0.001, and the arrow means
        "replace with."
      </p>
      <p>
        Why a sum at all? Because gradient descent, the only engine we have, needs one number to
        minimize, and the sum is the cheapest way to fold K scores into one. It carries a hidden promise:
        a step that lowers the sum could secretly raise one of the terms, as long as the others fall by
        more. The weights are the only control over how much say each task gets in that bargain.
      </p>

      <Intuition>
        <p>
          Try it. Two tasks, losses 600 and 0.4. Drag the weights and watch which task the sum actually
          cares about.
        </p>
      </Intuition>

      <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
        {[
          { label: "w₁ · task 1 (L₁ = 600)", v: w1, set: setW1 },
          { label: "w₂ · task 2 (L₂ = 0.4)", v: w2, set: setW2 },
        ].map(({ label, v, set }) => (
          <div key={label} style={{ marginBottom: 8 }}>
            <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{label}</span>
              <span className="mono">{v.toFixed(1)}</span>
            </div>
            <input type="range" min={0} max={3} step={0.1} value={v} onChange={(e) => set(+e.target.value)} />
          </div>
        ))}
        <div className="mono" style={{ color: "var(--lighter)", marginTop: 8 }}>
          total loss = {(w1 * 600).toFixed(0)} + {(w2 * 0.4).toFixed(2)} = {(w1 * 600 + w2 * 0.4).toFixed(2)}
        </div>
        <div className="small dim" style={{ marginTop: 6 }}>
          Task 1 contributes {((100 * w1 * 600) / (w1 * 600 + w2 * 0.4 || 1)).toFixed(1)}% of the total.
          To make task 2 matter at all you must crank w₂ into the thousands — and the right answer
          changes as training proceeds.
        </div>
      </div>

      <h3>Three diseases, one symptom</h3>
      <p>
        With equal weights, "train on the sum" is what most codebases do first. Sometimes it works.
        Often it quietly fails: one task stalls far behind what it could do alone, or all of them get
        worse. When the joint model loses to separate single-task models, researchers call it{" "}
        <strong>negative transfer</strong>. The failure is usually diagnosed from a loss curve, but the
        loss curve hides which of three different diseases you actually have. They look alike from the
        outside and demand different medicine.
      </p>

      <FailureModesGrid />

      <div className="grid md:grid-cols-3 gap-3" style={{ margin: "0 0 18px" }}>
        <p className="small dim">
          <strong style={{ color: "#c6a1ce" }}>Scale.</strong> A depth loss near 10³ and a classification loss near 1
          are just numbers to gradient descent. The task with big numbers produces the big gradient, which swamps the
          others. Hand-tuning weights means searching K knobs, again every time the task set changes.
        </p>
        <p className="small dim">
          <strong style={{ color: "#aaf7b3" }}>Speed.</strong> One task may be nearly solved in the first 10% of
          training while another improves until the end. The fast task's gradients shrink as it finishes, so the
          weighting that was fair at step 100 is unfair at step 10,000. The balance must move with training.
        </p>
        <p className="small dim">
          <strong style={{ color: "#efedbd" }}>Direction.</strong> Two gradients can point against each other (cosine
          &lt; 0), so the average update contains a piece that actively raises one task's loss. Task gradients fight on
          the large majority of training steps — and a whisper turned up is still pointing the wrong way.
        </p>
      </div>

      <h3>The map for the rest of this guide</h3>
      <p>
        <strong>GradNorm</strong> fixes scale and speed: it learns the weights wᵢ so every task is
        equally loud and nobody falls behind. <strong>PCGrad</strong> and <strong>CAGrad</strong> fix
        direction: when task gradients fight, they reshape the update itself. The two families work on
        different problems, so you can combine them. The Compare tab lines them all up side by side.
      </p>
    </div>
  );
}
