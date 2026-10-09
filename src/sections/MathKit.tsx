import { useState } from "react";
import { TabHead, Eq, Intuition } from "../components/bits";
import { MathPanelsGrid } from "../components/MathPanels";

function DotProductToy() {
  const [angle, setAngle] = useState(100);
  const a = { x: 2, y: 0 };
  const rad = (angle * Math.PI) / 180;
  const b = { x: 1.6 * Math.cos(rad), y: 1.6 * Math.sin(rad) };
  const d = a.x * b.x + a.y * b.y;
  const cos = d / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  return (
    <div className="box" style={{ background: "var(--bg-tinted)", border: "1px solid rgba(203,198,185,.12)" }}>
      <div className="small dim" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>drag: angle between u and v</span>
        <span className="mono">{angle}°</span>
      </div>
      <input type="range" min={0} max={180} step={1} value={angle} onChange={(e) => setAngle(+e.target.value)} />
      <div className="mono" style={{ color: "var(--lighter)", fontSize: 15 }}>
        ⟨u,v⟩ = {d.toFixed(2)} · cos∠ = {cos.toFixed(2)} —{" "}
        <span style={{ color: cos > 0.02 ? "var(--pcgrad)" : cos < -0.02 ? "var(--danger)" : "var(--ink)" }}>
          {cos > 0.02 ? "they agree" : cos < -0.02 ? "they fight" : "perpendicular, indifferent"}
        </span>
      </div>
    </div>
  );
}

export default function MathKit() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part II · §3.1" title="A five-minute math refresher">
        The whole guide uses exactly six ideas from math, all simple once seen the right way. If vectors
        and gradients are old friends, skip ahead.
      </TabHead>

      <p className="dim small">
        The whole toolkit in four draggable pictures — the interactive version of the paper's Figure 3.
        Drag the arrowheads and the point, and watch the numbers respond. Then read the six ideas below
        with these pictures in hand.
      </p>
      <MathPanelsGrid />

      <h3>1. A vector is an arrow</h3>
      <p>
        A vector is just a list of numbers, like (3, 1). Picture it as an arrow on a map: start at the
        origin, go 3 steps east and 1 step north. A model's parameters θ form a vector too — a list with
        millions of entries, so the "map" has millions of directions. We cannot draw that, but every fact
        about 2-D arrows stays true there.
      </p>

      <h3>2. The norm is the arrow's length</h3>
      <Eq caption="By Pythagoras. When this guide says a gradient is 'loud,' it means its norm is large.">
        ‖(3,1)‖ = √(3² + 1²) = √10 ≈ 3.16
      </Eq>

      <h3>3. The dot product is an agreement meter</h3>
      <p>
        Multiply matching entries and add: ⟨(3,1), (−1,2)⟩ = 3·(−1) + 1·2 = <strong>−1</strong>. The dot
        product also equals the two lengths times the cosine of the angle between the arrows, so its{" "}
        <strong>sign</strong> tells you whether two arrows agree: positive means roughly the same
        direction, zero means exactly perpendicular, negative means they partly oppose each other.
        Dividing by the lengths gives the <strong>cosine similarity</strong>, a scale-free agreement
        score between −1 and 1.
      </p>
      <Eq>⟨u,v⟩ = ‖u‖‖v‖·cos θ &nbsp;&nbsp;⇒&nbsp;&nbsp; cos∠(u,v) = ⟨u,v⟩ / (‖u‖‖v‖)</Eq>
      <DotProductToy />

      <h3>4. The gradient is an uphill compass</h3>
      <p>
        A loss L(θ) assigns a "badness height" to every setting of the knobs — picture a hilly
        landscape. The gradient ∇L(θ) is the arrow pointing straight uphill from where you stand, with
        length equal to the steepness. Training follows −∇L, straight downhill. Each task has its own
        landscape and therefore its own gradient arrow —{" "}
        <strong>and those arrows need not point the same way</strong>. That sentence is the seed of every
        problem in this guide.
      </p>

      <h3>5. Projection is casting a shadow</h3>
      <p>
        The projection of g₁ onto g₂ is the shadow g₁ casts on g₂'s line:
      </p>
      <Eq caption="The agreement score, divided by g₂'s squared length, times g₂ itself.">
        proj<sub>g₂</sub>(g₁) = ( ⟨g₁,g₂⟩ / ‖g₂‖² ) · g₂
      </Eq>
      <p>
        Subtracting the shadow from g₁ leaves the part perpendicular to g₂. When the dot product is
        negative, the shadow points <em>against</em> g₂, so the leftover is "g₁ with the anti-g₂ part
        removed." PCGrad is exactly this one subtraction.
      </p>
      <Intuition>
        <p>
          Where does the formula come from? The shadow lies on g₂'s line, so it must be some scaled copy
          t·g₂. A shadow meets the line at a right angle, and "right angle" means dot product zero:
          ⟨g₁ − t·g₂, g₂⟩ = 0, which solves to t = ⟨g₁,g₂⟩ / ‖g₂‖². One line of algebra and the formula
          pops out.
        </p>
      </Intuition>

      <h3>6. A convex blend is a way to split 100%</h3>
      <p>
        A convex combination of the task gradients is a blend where every weight is at least zero and
        the weights sum to one: each task gets a percentage of the mix. The set of all legal weight
        lists is the <strong>simplex</strong>, written Δ. Two more bits of vocabulary:{" "}
        <strong>minₓ f(x)</strong> is the lowest value f can reach; <strong>argminₓ f(x)</strong> is the
        setting of x that reaches it — the best knob position, not the best score.
      </p>
      <Eq>w₁g₁ + w₂g₂ + ⋯ + w_K g_K, &nbsp; wᵢ ≥ 0, &nbsp; <span className="op">∑</span>ᵢ wᵢ = 1</Eq>
      <p>
        Why do blends matter so much? Because blending is the cheapest way for tasks to compromise, and
        one fact pays off twice later: <strong>a blend can never do worse than its worst ingredient</strong>.
        If every task's arrow likes a step, every blend likes it too. So "search over all blends" often
        turns out to be the same problem as "protect the worst task" — only much cheaper to solve.
      </p>

      <Intuition>
        <p>
          <strong>How to read any equation here.</strong> An equation is a sentence. The left side of =
          is the name of the thing; the right side is the recipe for computing it. Read it aloud in words
          before reading it in symbols — every worked example in this guide redoes the key computations
          with real numbers.
        </p>
      </Intuition>
    </div>
  );
}
