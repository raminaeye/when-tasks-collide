import { TabHead, Eq, Intuition, Worked } from "../components/bits";
import BlendExplorer from "../components/BlendExplorer";
import { C1Walkthrough } from "../components/Walkthroughs";

export default function Pareto() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part II · §3.2–3.3" title="When the average betrays a task — and the Pareto lens">
        The key question of the whole guide, asked early: when is the average gradient a bad deal for one
        of the tasks?
      </TabHead>

      <h3>The betrayal test</h3>
      <p>
        Walking along the average gradient g₀ is the steepest way down for the average loss, but nothing
        says it helps every task. Take a small step in some direction d (θ ← θ − αd). Task i's loss
        changes by roughly −α⟨gᵢ, d⟩ — "slope times move, knob by knob," which is exactly what a dot
        product computes. Since α is positive:
      </p>
      <Eq caption="Positive dot product means the step helps the task; negative means it hurts.">
        ⟨gᵢ, d⟩ &gt; 0 <span className="op"> ⇒ </span> task i improves
      </Eq>
      <p>
        So whenever some task has ⟨gᵢ, g₀⟩ &lt; 0, the usual update d = g₀ makes task i{" "}
        <strong>worse</strong>. The majority outvotes a minority of one. Keep your eye on this one dot
        product: it is the test every method in this guide uses, and each method is really just a
        different way of picking a d so that no task's score comes out too negative.
      </p>

      <Worked title="C.1 · the failure, with numbers">
        <p className="small">
          g₁ = (2, 0) points east with length 2; g₂ = (−1, 0.5) points west and slightly north, length ≈
          1.1. Plain training follows the average: d = ½(g₁+g₂) = (0.5, 0.25), leaning task 1's way
          because its arrow is longer.
        </p>
        <p className="small mono">
          task 1's score: ⟨g₁,d⟩ = 2(0.5) + 0(0.25) = <span style={{ color: "var(--pcgrad)" }}>+1</span> — helped<br />
          task 2's score: ⟨g₂,d⟩ = (−1)(0.5) + (0.5)(0.25) = <span style={{ color: "var(--danger)" }}>−0.375</span> — hurt
        </p>
        <p className="small" style={{ marginBottom: 0 }}>
          Task 1's arrow is longer, so it outvotes task 2 in the average. That is the entire conflict
          problem in one line of arithmetic. §5 and §6 are two ways of editing d so both scores come out
          positive — try these exact vectors in the Playground tab.
        </p>
      </Worked>

      <C1Walkthrough />

      <h3>The Pareto lens: many ways to be "optimal"</h3>
      <p>
        With one loss, comparing two models is easy: lower wins. With K losses, model A can beat model B
        on task 1 while losing on task 2 — neither is "better," full stop. So "optimal" needs a new
        meaning.
      </p>
      <ol className="steps">
        <li>
          <strong>Pareto-dominated:</strong> some other point is at least as good on every task and
          strictly better on one. There is a free upgrade available, so why stay?
        </li>
        <li>
          <strong>Pareto-optimal:</strong> nothing dominates it — you cannot improve any task without
          hurting another. All the free upgrades are used up. The set of all such points is the{" "}
          <strong>Pareto set</strong>.
        </li>
        <li>
          <strong>Pareto-stationary:</strong> some blend of the task gradients cancels out to zero there
          (min over w∈Δ of ‖∑wᵢgᵢ‖ = 0). Every Pareto-optimal point is Pareto-stationary, just as every
          single-task minimum has ∇L = 0.
        </li>
      </ol>

      <p>
        Here is the catch: the Pareto set is not one point, it is a whole curve of trade-offs. The
        classical method <strong>MGDA</strong> blends the task gradients into the shortest possible
        combination and steps along it, and it is proven to reach <em>some</em> Pareto-stationary point.
        But "some" hides a problem: which point you reach is decided by where you started, not by
        anything you chose. The average loss — the thing you actually wanted to minimize — is left to
        luck. Closing that gap is exactly what CAGrad does.
      </p>

      <Intuition>
        <p>
          Think of the Pareto set as a menu of all the fair compromises. MGDA and PCGrad only promise to
          seat you somewhere on the menu; the kitchen picks the dish. Minimizing the average loss is
          ordering a specific dish. You want the dish you ordered, plus a guarantee that the kitchen is
          actually cooking it.
        </p>
      </Intuition>

      <h3>Feel it: the simplex and the shortest blend</h3>
      <BlendExplorer />
    </div>
  );
}
