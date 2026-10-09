import { TabHead, Eq, Intuition, Worked, Code } from "../components/bits";
import LandscapeRacer from "../components/LandscapeRacer";
import { C4Walkthrough } from "../components/Walkthroughs";

export default function CAGradTab() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part III · §6 · NeurIPS 2021" title="CAGrad: conflict-averse descent with a guarantee">
        CAGrad asks the boldest question of the three: can we calm the fights between tasks and still{" "}
        <em>prove</em> we are making progress on the average loss we actually care about? Yes — as long
        as we stay near the average gradient and spend the little freedom we have on the task that needs
        it most.
      </TabHead>

      <Intuition>
        <p>
          CAGrad is a <strong>diplomat on a leash</strong>. The leash is a circle of radius c‖g₀‖ drawn
          around the average gradient g₀: the update may not stray further than that from the consensus
          direction (staying close is what keeps the proof alive). Inside the circle, the diplomat
          spends all of that limited freedom on one goal: help the worst-off task as much as possible.
          At c = 0 the circle shrinks to a point — plain gradient descent. As c → ∞ the leash comes off
          and the rule becomes MGDA. The useful range is in between.
        </p>
      </Intuition>

      <h3>The primal problem</h3>
      <p>
        Remember: the dot product ⟨gᵢ,d⟩ scores a candidate step d — positive means task i's loss goes
        down. CAGrad judges a step by its <strong>worst</strong> score across all tasks, then picks the
        step that makes that worst score as good as possible:
      </p>
      <Eq caption="Inside a ball around the average gradient, find the direction that helps the least-helped task the most.">
        max<sub>d</sub> min<sub>i∈[K]</sub> ⟨gᵢ, d⟩ &nbsp; s.t. &nbsp; ‖d − g₀‖ ≤ c‖g₀‖
      </Eq>
      <p>
        Read it from the inside out: pick any candidate d; let every task score it and keep only the
        lowest score; choose the d whose lowest score is highest; and one restriction — d must stay
        inside a ball of radius c‖g₀‖ around g₀. If c = 0.5 and ‖g₀‖ = 2, the ball has radius 1. If a
        step exists that helps everyone, the best worst score is positive and every task improves.
      </p>

      <h3>Why the problem is shaped this way: four choices, four reasons</h3>
      <ol className="steps">
        <li>
          <strong>Why judge a step by its worst task?</strong> The average score is exactly what
          betrayed task 2 in §3.2: a loud task can outvote a hurt one and the average never notices.
          Taking the minimum is a weakest-link rule — betrayal has nowhere to hide.
        </li>
        <li>
          <strong>Why the ball around g₀?</strong> Without it the rule turns into MGDA, which wanders as
          far from the average as it takes to keep the peace, with no promise about where it ends up.
          The ball is what buys the proof: any d within c‖g₀‖ of g₀ keeps a positive fraction of g₀'s
          downward push on the average loss.
        </li>
        <li>
          <strong>Why radius c‖g₀‖, not fixed?</strong> So the leash grows and shrinks with the terrain.
          Early in training gradients are large and a fixed radius would be uselessly tight; late, it
          would be uselessly loose. A fixed fraction keeps the diplomat's freedom constant in the only
          units that matter — and makes c unit-free, so no rescaling of the losses can game it.
        </li>
        <li>
          <strong>Why solve the dual?</strong> The primal searches over d in the full parameter space —
          millions of dimensions, every step. The dual searches over K blend weights, and K is 2–50.
          Same answer, vastly less work: the paper notes the solve is negligible next to a backward
          pass for small K.
        </li>
      </ol>

      <h3>Algorithm 3 · per training step</h3>
      <ol className="steps">
        <li>Forward pass; compute each task loss Lᵢ.</li>
        <li>Compute each task gradient gᵢ = ∇_θsh Lᵢ and their average g₀ = (1/K)Σgᵢ.</li>
        <li>Solve the dual: over all blends w in the simplex, minimize F(w) = g_wᵀg₀ + c‖g₀‖‖g_w‖, where g_w = Σwᵢgᵢ.</li>
        <li>Form the update d = (1/(1+c))(g₀ + c‖g₀‖·g_w*/‖g_w*‖) from the winning blend w*.</li>
        <li>Step the network with d as usual.</li>
      </ol>

      <Code>
{`import numpy as np
from scipy.optimize import minimize

def cagrad_combine(grads, c=0.4):
    G = np.stack(grads); g0 = G.mean(axis=0); K = len(G)
    phi = c**2 * (g0 @ g0)
    def F(w):                       # the dual objective
        gw = w @ G
        return gw @ g0 + np.sqrt(phi) * np.linalg.norm(gw)
    w = minimize(F, np.full(K, 1/K), bounds=[(0, 1)] * K,
                 constraints={'type': 'eq', 'fun': lambda w: w.sum() - 1}).x
    gw = w @ G
    return (g0 + c * np.linalg.norm(g0) * gw / np.linalg.norm(gw)) / (1 + c)  # normalized as in the official code`}
      </Code>
      <p className="dim small">
        The last line is the "diplomat on a leash" in one expression: the consensus direction, plus one
        bounded act of independence.
      </p>

      <Worked title="C.4 deep dive · the dual trick, why this is computable">
        <p className="small">
          The primal searches over d ∈ Rᵐ with millions of dimensions — out of the question at every
          step. The rescue is duality. First, the inner minimum over tasks rewrites as a minimum over
          blends, because the worst blend is always just the worst single task (a blend cannot hide
          below its worst ingredient):
        </p>
        <p className="small mono">minᵢ ⟨gᵢ,d⟩ = min_w∈Δ ⟨g_w, d⟩, where g_w = Σwᵢgᵢ</p>
        <p className="small">
          Standard duality then lets us swap min and max and solve the inner problem over d exactly,
          collapsing everything into a K-dimensional problem over the blend weights:
        </p>
        <p className="small mono">
          w* = argmin F(w) = g_wᵀg₀ + √φ‖g_w‖, &nbsp; φ = c²‖g₀‖²<br />
          λ* = ‖g_w*‖/√φ, &nbsp; d* = g₀ + g_w*/λ* = g₀ + c‖g₀‖·ĝ_w*
        </p>
        <p className="small" style={{ marginBottom: 0 }}>
          <strong>The final form is worth reading twice: the update is the average gradient plus a
          bounded correction of length c‖g₀‖ in the direction of the best blend of task gradients</strong>,
          where "best" trades helping the worst-off task against staying near g₀. (The "hat" means
          "scaled to length one": it keeps only the direction; c‖g₀‖ supplies the length.) Since K is
          2–50, this small problem is solved almost for free at each step.
        </p>
      </Worked>

      <C4Walkthrough />

      <h3>One knob, two classics</h3>
      <p>
        The knob c is a dial between two older methods. At c = 0 the ball shrinks to a point: CAGrad is
        plain gradient descent. As c → ∞, the dual is dominated by the ‖g_w‖ term — exactly MGDA's
        shortest-blend rule. The new territory is in between: more careful about conflict than plain
        descent, more purposeful than MGDA. Try the c-slider in the Playground's CAGrad mode to watch
        the dial turn.
      </p>

      <h3>The guarantee, translated</h3>
      <Eq caption="The squared steepness of the average loss, added over all steps, never exceeds a fixed budget — so the steepness must shrink to zero: a stationary point of L₀.">
        Σ<sub>t</sub> ‖∇L₀(θ_t)‖² ≤ 2(L₀(θ₀) − L₀*) / ( α(1 − c²) )
      </Eq>
      <p>
        The assumptions in plain words: <strong>H-Lipschitz gradients</strong> means the landscape never
        curves too sharply (a smoothness budget). <strong>Bounded below</strong> means the loss has a
        floor it cannot fall under. <strong>Step size α ≤ 1/H</strong> means steps small enough for that
        curvature. The budget makes sense too: the numerator is how far above the floor you start, and
        the denominator says bigger steps buy progress while a bigger c costs you some.
      </p>
      <ol className="steps">
        <li>
          <strong>You keep your objective.</strong> Unlike MGDA or PCGrad, the proven destination is a
          stationary point of L₀ itself, not some arbitrary trade-off chosen by the starting point.
        </li>
        <li>
          <strong>Balancing has a price.</strong> The guarantee weakens by (1 − c²): more
          conflict-avoidance, slower worst-case progress.
        </li>
        <li>
          <strong>The guarantee only holds for c &lt; 1</strong> — why the recommended range sits
          comfortably below 1 (c = 0.4 on NYUv2, 0.2 on Cityscapes).
        </li>
      </ol>

      <h3>The acid test: one landscape, four fates</h3>
      <p>
        This is the real toy landscape from the paper's §5.1, running live in your browser. The
        toy model has exactly two adjustable numbers, so every possible model is a point on the map;
        the colors show the average loss as height. The <strong>gray bar</strong> is the Pareto set;{" "}
        <strong>★</strong> is its best point. Four methods walk downhill from the same start, using only
        what they can feel under their feet.
      </p>
      <LandscapeRacer />

      <h3>What the replay shows (20,000 steps, five starts)</h3>
      <ol className="steps">
        <li>
          <strong>GD stalls.</strong> Its trail dies in the ravine on three of five starts, final L₀ ≈
          1.7–3.5 — miles above the minimum −15.09. On the trapped runs the two task gradients
          fight on about half of all steps and never stop: conflict is not a passing storm, it is
          the climate of the trap.
        </li>
        <li>
          <strong>MGDA and PCGrad escape</strong> — MGDA reaches the low-loss region on all five runs,
          PCGrad on four of five — but they stop wherever they first touch the Pareto set, final L₀
          anywhere from about −10 to −15.1, decided by the start, not by the task.
        </li>
        <li>
          <strong>CAGrad (c = 0.5) keeps descending.</strong> Two of five runs land exactly on the ★
          (−15.09); the other three are still on their way down, at −12.7 to −15.0, when the 20,000
          steps run out. (Give it the paper's 100,000 steps and all five arrive.)
        </li>
        <li>
          <strong>The c-dial confirmed:</strong> c = 0 reproduces GD's failures exactly, c = 10 behaves
          like MGDA (scattered landings), and mid-range values cluster around c = 0.5's behavior.
        </li>
      </ol>

      <h3>Practical notes</h3>
      <ol className="steps">
        <li>
          <strong>Reach for it when</strong> you want PCGrad-style conflict handling and a real
          objective to stand behind — especially when runs from different starting points need to
          behave the same way.
        </li>
        <li>
          <strong>Costs:</strong> K backward passes plus one tiny solve per step. For many tasks,
          CAGrad-Fast works on a random handful per step (the guarantee survives) — about 2× and 5×
          faster than PCGrad on the 10- and 50-task Meta-World benchmarks with similar results.
        </li>
        <li>
          <strong>Keep in mind:</strong> the proof assumes smooth losses and small steps. Real networks
          are messier, so treat c as a knob you tune even though it has a theoretical meaning.
        </li>
      </ol>

      <h3>The knob c, and the hidden second knob</h3>
      <p>
        <strong>How to set c:</strong> start at 0.2–0.5. If the worst task is still being ignored (its
        loss flatlines while the others fall), raise c — you are buying it a louder voice. If the
        average loss improves too slowly, lower c — you are straying too far from the objective. Too
        small (c → 0) and you inherit GD's stalls; too large and you inherit MGDA's scattered landings,
        and above c = 1 the proof is gone. The good news: the sweet spot is wide — on the toy, c = 0.5
        and c = 0.8 descend from every start (c = 0.2 still stalls from the two hardest starts at
        20,000 steps).
      </p>
      <p>
        <strong>The hidden knob: how many tasks per step.</strong> With many tasks, the K backward
        passes are the real cost. Treat the CAGrad-Fast subset size like a batch size: bigger is
        steadier and costlier, smaller is noisier and faster.
      </p>
    </div>
  );
}
