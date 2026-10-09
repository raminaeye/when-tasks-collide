import { TabHead, Eq, Intuition, Code } from "../components/bits";
import UncertaintyExplorer from "../components/UncertaintyExplorer";

export default function UncertaintyTab() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part III · §7 · CVPR 2018" title="Uncertainty weighting: let the losses price themselves">
        The gradient methods step in after the losses exist. This older, quieter idea works one level
        earlier: instead of asking "how should I fix conflicting gradients," it asks "how loud should
        each loss be in the first place" — and answers with a principle from probabilistic modeling: a
        loss that is inherently noisier should count less.
      </TabHead>

      <h3>The intuition: some tasks are just harder to be sure about</h3>
      <p>
        Think of each task's output as a measurement. Some measurements are crisp: given the same input,
        the right answer barely changes (is this a cat or a dog). Some are inherently fuzzy: predicting
        the exact depth of every pixel has a floor of guesswork no model can beat, because the
        information simply is not in the image. Kendall, Gal, and Cipolla call this irreducible
        fuzziness <strong>task uncertainty</strong>, written σᵢ. A task with high σᵢ is one where even
        a perfect model would still spread probability over several answers.
      </p>
      <p>
        The key move: if a task is that noisy, pushing hard on its loss is partly pushing on noise — the
        model chases fluctuations it cannot remove. The sensible thing is to turn the volume down on
        exactly those tasks, by an amount tied to how noisy they are. Each task gets a weight of
        1/σᵢ² — a task twice as noisy counts four times less — and the σᵢ are <strong>learned as
        parameters during training</strong>, not set by hand.
      </p>

      <h3>The objective, in plain words</h3>
      <Eq caption="For ordinary regression or classification losses.">
        L_total = <span className="op">Σ</span>ᵢ ( Lᵢ / (2σᵢ²) + log σᵢ )
      </Eq>
      <ol className="steps">
        <li><strong>Lᵢ</strong> is task i's usual loss, the same number you already compute.</li>
        <li><strong>σᵢ</strong> is the learned noise level of task i — one number per task, bigger means noisier.</li>
        <li>
          <strong>1/(2σᵢ²)</strong> is the volume knob. As σᵢ grows, the task is turned down,
          quadratically. A noisy task automatically fades into the background.
        </li>
        <li>
          <strong>log σᵢ</strong> is the penalty that keeps the model honest. Without it, the model
          could make every task "free" by inflating every σᵢ to infinity. The log term charges a price
          for saying "this task is noisy," so a task only gets turned down if it genuinely is.
        </li>
      </ol>

      <Intuition>
        <p>
          In one sentence: the model is allowed to quiet a task, but it has to pay log σᵢ for the
          privilege — so it only quiets tasks that truly are noisy.
        </p>
      </Intuition>

      <h3>Feel the pricing</h3>
      <UncertaintyExplorer />

      <h3>Algorithm 5 · per training step</h3>
      <ol className="steps">
        <li>Forward pass; compute each task loss Lᵢ.</li>
        <li>Form the total L_total = Σᵢ (Lᵢ/(2σᵢ²) + log σᵢ).</li>
        <li>Backpropagate L_total once. The gradient reaches both the network and the log σᵢ values, since they are learnable.</li>
        <li>Step the network and the log σᵢ together with the same optimizer.</li>
      </ol>

      <Code>
{`# log_sigma = learnable vector, one entry per task, init 0
for i in range(K):
    sigma2 = exp(2 * log_sigma[i])   # sigma_i^2, always positive
    w_i = 1 / (2 * sigma2)           # the volume knob
    total += w_i * losses[i] + log_sigma[i]  # loss + the honesty price
backward(total)   # one pass updates network AND log_sigma
step(optimizer)   # network and sigmas learn together`}
      </Code>
      <p className="dim small">
        The loop is deliberately boring: no second optimizer, no gradient editing, no extra backward
        pass. Paste the loss, add one vector of parameters, done — the cheapest of the four to adopt.
      </p>

      <h3>What it fixes, and what it cannot</h3>
      <p>
        Uncertainty weighting is a <strong>scale method</strong>, and a principled one. Where GradNorm
        learns weights to equalize training speed, uncertainty weighting sets weights from the data's
        inherent noise, before training dynamics enter the picture. On multi-task vision benchmarks it
        matched or beat hand-tuned and grid-searched weights.
      </p>
      <p>
        But it does nothing about <strong>direction</strong>. Two tasks can be perfectly weighted by
        noise and still have gradients that point against each other; the method never looks at the
        gradients at all, only at the loss values and the σᵢ. It is a thermostat for volume, with no
        shadow-cutting and no leash. Two practical notes: the σᵢ are usually learned as log σᵢ (an
        unconstrained number, easier for the optimizer) and exponentiated inside the loss; and because
        the method only sees losses, it <strong>composes cleanly with the gradient-level methods</strong>{" "}
        — weight the losses by learned uncertainty, then run PCGrad or CAGrad on the resulting
        gradients, letting the σᵢ handle scale while the surgery handles direction.
      </p>

      <h3>How it sits next to the other three</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Method</th><th>The question it answers</th></tr></thead>
          <tbody>
            <tr><td><strong>GradNorm</strong></td><td>How loud should each task be, to keep progress balanced? (learned, driven by training dynamics)</td></tr>
            <tr><td><strong>Uncertainty</strong></td><td>How loud should each task be, given how noisy it inherently is? (learned, driven by the data)</td></tr>
            <tr><td><strong>PCGrad</strong></td><td>How should the directions be edited so tasks stop fighting?</td></tr>
            <tr><td><strong>CAGrad</strong></td><td>How do we protect the worst-off task and stay near the average, with a guarantee?</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Uncertainty weighting and GradNorm are the two volume knobs — one set by noise, one by pace.
        PCGrad and CAGrad are the steering. A real system can use one from each pair, and many do.
      </p>
    </div>
  );
}
