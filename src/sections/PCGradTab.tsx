import { TabHead, Eq, Intuition, Worked, Code } from "../components/bits";
import PCGradSurgery from "../components/PCGradSurgery";

export default function PCGradTab() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part III · §5 · NeurIPS 2020" title="PCGrad: surgery on conflicting directions">
        PCGrad ignores the size of gradients completely and goes straight after the direction problem.
        Its rule fits in one sentence: if two task gradients fight, cut off the part of each one that
        works against the other, and only then add them up.
      </TabHead>

      <Intuition>
        <p>
          Two people are steering one cart. One pulls north-east, the other pulls north-west, so part of
          each person's effort is wasted fighting the other. PCGrad is the moment they make a deal: "I
          will drop the part of my pull that works against you, if you drop the part of yours that works
          against me." What is left still moves the cart forward for both of them. And nobody gave up
          any part of their pull that was actually helping.
        </p>
      </Intuition>

      <h3>The geometry</h3>
      <p>
        A fight is measured by the cosine of the angle ϕᵢⱼ between two task gradients. When cosϕᵢⱼ &lt;
        0, PCGrad cuts the shadow:
      </p>
      <Eq caption="The subtracted piece is exactly the part of gᵢ that points against gⱼ; everything that agrees, or is sideways, is left alone.">
        gᵢ ← gᵢ − ( gᵢ·gⱼ / ‖gⱼ‖² ) · gⱼ
      </Eq>
      <p>
        — and does the same cut on gⱼ. With more than two tasks, each gradient is cut against the others
        one by one, in <strong>random order each step</strong>. Pairs that are not fighting are never
        touched, so cooperation costs nothing.
      </p>

      <h3>Why the surgery works: three choices, three reasons</h3>
      <ol className="steps">
        <li>
          <strong>Why cut exactly the shadow?</strong> The shadow is the only part of gᵢ that task j can
          feel: the leftover is at a right angle to gⱼ, so it cannot move task j's loss at all. Cutting
          less would leave some of the fight in place; cutting more would throw away parts of gᵢ that
          were helping task i for free. The shadow is the smallest possible edit that makes the two
          gradients harmless to each other.
        </li>
        <li>
          <strong>Why cut both gradients?</strong> One-sided surgery only moves the problem: the combined
          step can end up pointing against the un-cut task. Cutting both sides guarantees ⟨g₁′,g₂⟩ =
          ⟨g₂′,g₁⟩ = 0, so the final sum contains nothing that fights either task.
        </li>
        <li>
          <strong>Why a random order?</strong> A later cut can undo an earlier one, so the answer depends
          on the order, and whichever task is processed last gets the cleanest gradient. Shuffling every
          step shares that advantage evenly over training.
        </li>
      </ol>

      <Worked title="C.3 · one PCGrad surgery, with numbers">
        <p className="small mono">
          g₁ = (3, 1), g₂ = (−1, 2).<br />
          1 · check the fight: ⟨g₁,g₂⟩ = 3(−1)+1(2) = −1 &lt; 0 → cut.<br />
          2 · shadow of g₁ on g₂: (−1/5)·g₂ = (0.2, −0.4) — the minus sign means it points against g₂.<br />
          3 · subtract: g₁ ← (3,1) − (0.2,−0.4) = (2.8, 1.4).<br />
          4 · check: ⟨(2.8,1.4), g₂⟩ = −2.8 + 2.8 = 0 — exact right angle, it can no longer hurt task 2.
        </p>
        <p className="small" style={{ marginBottom: 0 }}>
          The same surgery on the other side gives g₂ ← (−0.7, 2.1), perpendicular to g₁. The update
          changes from (2, 3) to (2.1, 3.5) — nearly the same step, but now guaranteed to contain nothing
          that fights either task. Try these exact vectors in the Playground.
        </p>
      </Worked>

      <h3>Watch the surgery happen (Figures 6–7, animated)</h3>
      <p>
        The paper draws this as a four-beat sequence. Step through it: the check, the shadows, the cut,
        and the final add — using the exact vectors from worked example C.3.
      </p>
      <PCGradSurgery />

      <h3>Algorithm 2 · per training step</h3>
      <ol className="steps">
        <li>Compute each task gradient gᵢ on the shared parameters (one backward pass per task).</li>
        <li>For each task i: for every other task j in random order, if gᵢ·gⱼ &lt; 0, cut the shadow: gᵢ ← gᵢ − (gᵢ·gⱼ/‖gⱼ‖²)gⱼ.</li>
        <li>Combine the edited gradients (sum or average) and hand the result to any optimizer — SGD, Adam, anything.</li>
      </ol>

      <Code>
{`import numpy as np
def pcgrad_combine(grads):
    # grads: list of per-task gradient vectors on the shared parameters
    g = [x.copy() for x in grads]
    for i in range(len(g)):
        for j in np.random.permutation(len(g)):   # random order, fairness
            if i != j and g[i] @ g[j] < 0:         # conflict detected
                g[i] -= (g[i] @ g[j]) / (g[j] @ g[j]) * g[j]  # cut the shadow
    return sum(g)`}
      </Code>

      <h3>When does surgery actually pay? The tragic triad</h3>
      <p>
        Conflict alone is not fatal. It only turns destructive when three things come together:
      </p>
      <ol className="steps">
        <li>
          <strong>Conflicting gradients</strong> — the tasks pull against each other, cosϕᵢⱼ &lt; 0;
        </li>
        <li>
          <strong>Dominating gradients</strong> — one task is much louder, measured by Φ(gᵢ,gⱼ) =
          2‖gᵢ‖‖gⱼ‖ / (‖gᵢ‖²+‖gⱼ‖²), which equals 1 when the two are equally loud and shrinks toward 0
          as the gap grows;
        </li>
        <li>
          <strong>High curvature</strong> along the combined direction, so the hopeful "everyone
          improves a little" picture breaks within a single step.
        </li>
      </ol>
      <p>
        The theory ties it together: PCGrad is proven to lower the multitask loss more than plain
        gradient descent exactly when the fight is strong compared to the loudness gap (cosϕ ≤
        −Φ/12), the landscape is curved enough, and the step size is big enough — in other words,
        exactly when the triad shows up. On simple convex two-task problems, PCGrad is proven to reach
        the best point or a point of perfect standoff. And the gains are real: over 30% absolute
        improvement on multi-task robot-learning benchmarks.
      </p>

      <h3>A case where the plain sum genuinely betrays a task</h3>
      <p>
        Task 1 is loud, g₁ = (3, 1); task 2 is quiet, g₂ = (−1.5, 0.5); they conflict (⟨g₁,g₂⟩ = −4).
        The sum (1.5, 1.5) raises task 2's loss, since ⟨g₁+g₂, g₂⟩ = −1.5 &lt; 0: the loud task simply
        outvotes the quiet one. After surgery, g₁′ = (0.6, 1.8) and g₂′ = (−0.3, 0.9), the combined step
        (0.3, 2.7) helps both: ⟨d,g₁⟩ = 3.6 and ⟨d,g₂⟩ = 0.9, both positive. This is the "Loud vs
        quiet" preset in the Playground — go look at it.
      </p>

      <h3>Practical notes</h3>
      <ol className="steps">
        <li>
          <strong>Reach for it when</strong> your task gradients often fight (negative cosines). Log the
          cosines first to check. It works with any model and has no hyperparameters.
        </li>
        <li>
          <strong>Costs:</strong> K backward passes per step and K stored gradients. With many tasks
          that is most of your budget — the fix is the subsampling trick used by CAGrad-Fast: apply the
          cuts to a random handful of tasks per step.
        </li>
        <li>
          <strong>Keep in mind:</strong> the answer depends on the cut order (hence the shuffle). The
          edited update can be shorter than the original, slowing things when fights are rare. And like
          MGDA, PCGrad gives you no say over which trade-off it lands on.
        </li>
      </ol>

      <h3>The knobs: there are none, and that is the point</h3>
      <p>
        No α, no c, nothing to tune — the cut is fully decided by the gradients themselves, and it wraps
        around any optimizer. Three practical choices remain, none of them really a knob:
      </p>
      <ol className="steps">
        <li>
          <strong>Sum or average?</strong> The paper sums. Averaging gives the same direction at a
          different size, which your learning rate absorbs either way.
        </li>
        <li>
          <strong>When does it do nothing?</strong> On steps where no pair fights, every cut is skipped
          and PCGrad is exactly plain gradient descent. Late in training, when tasks settle into
          agreement, that is most steps.
        </li>
        <li>
          <strong>With many tasks, the cost bites.</strong> K backward passes and K stored gradients per
          step — subsample the tasks.
        </li>
      </ol>
    </div>
  );
}
