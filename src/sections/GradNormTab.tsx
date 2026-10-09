import { TabHead, Eq, Intuition, Worked, Code } from "../components/bits";
import GradNormSim from "../components/GradNormSim";
import { C2Walkthrough } from "../components/Walkthroughs";

export default function GradNormTab() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part III · §4 · ICML 2018" title="GradNorm: balancing the scales">
        GradNorm takes on the scale and speed problems with one idea: stop hand-tuning the loss weights
        and let training learn them, so every task ends up equally loud and no task is left behind.
      </TabHead>

      <Intuition>
        <p>
          Picture K coaches all shouting advice at one athlete (the shared trunk). The loudest coach —
          the biggest gradient — is the only one the athlete hears, and the coach whose part of the
          training is nearly done keeps shouting anyway. GradNorm is the moderator in the room. It puts
          a volume knob wᵢ in front of each coach and keeps turning the knobs so that (a) everyone is
          equally easy to hear, and (b) a coach whose part of the job is falling behind gets turned up
          for a while. There is even a strength dial, α, for how hard the moderator pushes for equal
          progress.
        </p>
      </Intuition>

      <h3>The mechanism: two measurements, one rule</h3>
      <p>
        Every training step, each task produces a gradient — a to-do list of changes to the shared
        weights that would help that task. If task 1's list is full of small numbers and task 2's is
        full of huge ones, the sum looks like task 2's list. GradNorm's answer: adjust the knobs a
        little every step using two measurements, taken at the <strong>last shared layer W</strong> —
        the spot where the fight actually happens (about 5% extra training cost on NYUv2).
      </p>

      <h3>Quantity 1 · How loud is task i right now?</h3>
      <Eq caption="Task i's loudness at step t: the length of the gradient of its weighted loss, at the last shared layer.">
        G_W⁽ⁱ⁾(t) = ‖ ∇_W wᵢ(t) Lᵢ(t) ‖₂
      </Eq>
      <p>
        The gradient of wᵢLᵢ is just wᵢ times the gradient of Lᵢ — a constant passes straight through —
        so loudness is <em>knob × raw gradient length</em>. Turning the knob up makes the task louder by
        exactly that much. That is the lever GradNorm pulls. The average Ḡ_W across tasks is the
        reference volume everyone is compared against.
      </p>

      <h3>Quantity 2 · How far along is task i?</h3>
      <Eq caption="Current loss over initial loss: unit-free progress. 0.75 = three quarters of the way still to go.">
        L̃ᵢ(t) = Lᵢ(t) / Lᵢ(0)
      </Eq>
      <p>
        The division is the point: a depth loss near 800 and a classification loss near 2 cannot be
        compared directly, but "how much of my journey is left?" means the same thing for both. A small
        ratio means the task learned fast — hence the name <em>inverse training rate</em>.
      </p>

      <h3>Quantity 3 · Is task i behind the others?</h3>
      <Eq caption="Each ratio divided by the group average. r=1: on pace. r=0.5: ahead. r=1.5: behind, needs attention.">
        rᵢ(t) = L̃ᵢ(t) / ( (1/K) Σⱼ L̃ⱼ(t) )
      </Eq>
      <p>
        The ratio by itself does not tell you who needs help — if every task sits at 0.75, nobody is
        behind. The problem is tasks falling <em>out of sync</em>, and you only spot that by comparing
        each task to the group. Nice side effect: if all tasks move at the same speed, every rᵢ stays at
        1 and GradNorm does nothing. It only acts when tasks drift apart.
      </p>

      <h3>The target and the adjustment</h3>
      <Eq caption="Average loudness, boosted for whoever is behind. Two fixes in one formula.">
        G_W⁽ⁱ⁾(t) ↦ Ḡ_W(t) × [rᵢ(t)]<span className="op">^α</span>
      </Eq>
      <p>
        The average Ḡ_W pulls everyone toward the same volume — curing the scale problem. The factor
        [rᵢ]^α turns the volume up for tasks that are behind — curing the speed problem. The exponent α
        sets how hard the boost pushes.
      </p>
      <Eq caption="A sum of misses: how far is each actual loudness from its target?">
        L_grad(t) = <span className="op">Σ</span>ᵢ | G_W⁽ⁱ⁾(t) − Ḡ_W(t)[rᵢ(t)]^α |
      </Eq>
      <p>
        Then ordinary gradient descent on this penalty — but the things being adjusted are the{" "}
        <strong>knobs wᵢ, not the network</strong>. Two details turn this from a guess into a
        thermostat:
      </p>
      <ol className="steps">
        <li>
          <strong>Only the weights get updated</strong> (the network is held fixed for this step). Since
          loudness = knob × raw gradient length, raising wᵢ raises task i's loudness by the same factor:
          cheap, one small nudge per step.
        </li>
        <li>
          <strong>The weights are rescaled to sum to K after every update.</strong> Without this, the
          penalty has a cheat: shrink all weights and every norm shrinks, so L_grad falls without
          anything being balanced. The fixed budget stops the cheat — one task can only get louder if
          another gets quieter, and the overall learning speed stays the same, so comparisons with
          baselines stay fair.
        </li>
      </ol>

      <Intuition>
        <p>
          GradNorm is a <strong>thermostat, not a guess</strong>. Every step visits four stations:
          sense (measure loudness and progress) → compare (set targets) → correct (nudge the weights) →
          renormalize (clamp the budget). Because the loop re-measures after every correction, no lucky
          initial setting of the weights is ever needed.
        </p>
      </Intuition>

      <h3>Algorithm 1 · per training step</h3>
      <ol className="steps">
        <li>Forward pass; compute each task loss Lᵢ(t) and the weighted total ΣwᵢLᵢ.</li>
        <li>Compute G_W⁽ⁱ⁾(t) = ‖∇_W wᵢLᵢ‖₂ for each task at the last shared layer W, and their mean Ḡ_W(t).</li>
        <li>Compute loss ratios L̃ᵢ(t) = Lᵢ(t)/Lᵢ(0) and relative rates rᵢ(t).</li>
        <li>Form L_grad = Σᵢ|G_W⁽ⁱ⁾ − Ḡ_W[rᵢ]^α| and update only the weights: wᵢ ← wᵢ − λ_w ∂L_grad/∂wᵢ.</li>
        <li>Renormalize: wᵢ ← wᵢ · K/Σⱼwⱼ.</li>
        <li>Update the network with ∇_θ ΣwᵢLᵢ as usual.</li>
      </ol>

      <Code>
{`# after the forward pass: losses = [L_1..L_K]; w = trainable task weights
G     = [norm(grad(w[i] * losses[i], W)) for i in range(K)]  # loudness per task
ratio = losses / losses_0              # progress so far, unit-free
r     = ratio / mean(ratio)            # who is behind the pack? (r > 1 = behind)
target = mean(G) * r ** alpha          # average loudness, boosted for laggards
L_grad = sum(abs(G - target))          # how far each norm is from its target
w = w - lr_w * grad(L_grad, w)         # nudge ONLY the weights
w = w * K / sum(w)                     # fixed budget: one task up, another down`}
      </Code>

      <Worked title="C.2 · one GradNorm update, with numbers">
        <p className="small">
          Two tasks, mid-training: L₁(0)=2, L₁(t)=0.5 (nearly finished); L₂(0)=800, L₂(t)=600 (far from
          done). Measured loudness: G₁=4, G₂=400, average 202. With α = 0.5:
        </p>
        <p className="small mono">
          ratios: L̃₁ = 0.25, L̃₂ = 0.75 → mean 0.5 → r₁ = 0.5 (ahead), r₂ = 1.5 (behind)<br />
          targets: 202×0.5^0.5 ≈ 143 &nbsp;·&nbsp; 202×1.5^0.5 ≈ 247<br />
          penalty: |4−143| + |400−247| = 139 + 153
        </p>
        <p className="small" style={{ marginBottom: 0 }}>
          Task 1 is too quiet (4 ≪ 143) so its weight rises; task 2 is too loud (400 ≫ 247) so its
          weight falls; then both are rescaled to sum to 2 (w = [1.252, 0.748] in the paper's code). The
          scale term pulls both toward 202 while the rate term boosts whoever is behind — task 2 gets a
          1.22× boost, task 1 a 0.71× discount.
        </p>
      </Worked>

      <C2Walkthrough />

      <h3>Watch the thermostat work</h3>
      <GradNormSim />

      <h3>What the paper's toy showed (300× scale gap)</h3>
      <p>
        One shared trunk, two prediction tasks, task 2's targets 300× bigger than task 1's. With fixed
        equal weights, the quiet task stalls about 300× worse than training alone (0.033 vs 0.0001) —
        and the loud task is hurt too (647 vs 346 alone): the interference is not zero-sum. GradNorm
        improves both (0.026 and 497), turning the loud task's weight down to 0.018 and the quiet one's
        up to 1.98. With equal weights the loudness gap drifts to roughly 4,000:1; GradNorm holds it
        near 10:1 from the start. That equalizing of loudness is the entire mechanism.
      </p>

      <h3>Practical notes</h3>
      <ol className="steps">
        <li>
          <strong>Reach for it when</strong> your tasks have very different loss scales or learning
          speeds. The classic case is dense prediction (segmentation + depth + normals).
        </li>
        <li>
          <strong>Costs:</strong> one extra backward pass per task to get the per-task norms at W, plus a
          second-order term through L_grad. Modest in practice.
        </li>
        <li>
          <strong>Keep in mind:</strong> GradNorm is a heuristic with no convergence guarantee, and it
          says nothing about gradient <em>direction</em>. Two perfectly balanced gradients can still
          point against each other. That is what PCGrad and CAGrad are for.
        </li>
      </ol>

      <h3>The knobs, one by one</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Knob</th><th>What it does</th><th>How to set it</th><th>If you get it wrong</th></tr></thead>
          <tbody>
            <tr>
              <td className="mono">α</td>
              <td>How hard to push for equal progress; the exponent in Ḡ_W·[rᵢ]^α. α=0 switches the progress meter off (fixes scale only); α=1.5 is the NYUv2 value.</td>
              <td>Start at 0.5 for similar tasks, 1–1.5 for dissimilar ones. Results are not very sensitive — treat it as a coarse dial.</td>
              <td>Too small: a task that is always behind never gets volume. Too large: weights swing back and forth and training swings with them.</td>
            </tr>
            <tr>
              <td className="mono">λ_w</td>
              <td>How fast the knobs move — the learning rate of the weights themselves (the network's own rate is separate).</td>
              <td>10–100× smaller than the network's rate (the toy uses 2.5×10⁻⁴ next to SGD at 0.01). When in doubt, go small.</td>
              <td>Too big: weights overcorrect, loudness chases its own tail. Too small: balance arrives after the early, most damaged part of training.</td>
            </tr>
            <tr>
              <td className="mono">W</td>
              <td>The reference layer where loudness is measured — the last shared layer by default.</td>
              <td>Keep the default: deepest point still shared by all tasks, one extra backward pass per task.</td>
              <td>Earlier layers catch tasks before their effects have mixed; the heads measure the wrong thing entirely.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
