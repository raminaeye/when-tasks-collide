import { TabHead, Intuition } from "../components/bits";
import Flowchart from "../components/Flowchart";
import { BatchingWidget, FrozenHeadTest, LossStackLandscape } from "../components/FieldGuideWidgets";

export default function FieldGuide() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part IV · §9" title="A practitioner's field guide">
        Diagnose before you medicate. Three lines of logging tell you which of the three diseases you
        actually have — then the flowchart picks the medicine.
      </TabHead>

      <h3>9.1 · Diagnose before you medicate</h3>
      <ol className="steps">
        <li>
          <strong>Each task's loss, compared to training that task alone.</strong> A gap here is
          negative transfer, by definition. The other two measurements explain why the gap is there.
        </li>
        <li>
          <strong>Each task's gradient norm at a shared layer</strong> (∥∇_θsh Lᵢ∥). If one is orders
          of magnitude bigger than the others → scale problem → GradNorm or uncertainty weighting.
        </li>
        <li>
          <strong>The cosine between each pair of task gradients.</strong> Often negative → direction
          problem → PCGrad or CAGrad. (Remember: in the toy, once GD reached the ravine the two
          gradients fought on about 85% of all steps, for the rest of the run.)
        </li>
      </ol>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Symptom</th><th>Likely cause</th><th>First remedy</th></tr></thead>
          <tbody>
            <tr><td>One task dominates; others flatline from the start</td><td>loss-scale imbalance</td><td>GradNorm or uncertainty weighting</td></tr>
            <tr><td>Tasks take turns regressing during training</td><td>directional conflict</td><td>PCGrad (cheap to try, no knobs)</td></tr>
            <tr><td>Results swing wildly with the random seed / init</td><td>arbitrary Pareto landing</td><td>CAGrad with c ≈ 0.2–0.4</td></tr>
            <tr><td>Fast task plateaus, slow task starves late in training</td><td>rate imbalance</td><td>GradNorm (α ↑) or dynamic weighting</td></tr>
            <tr><td>Every fix helps a little, but single-task models still win big</td><td>capacity / architecture, not optimization</td><td>Widen the trunk, soft sharing, task grouping</td></tr>
          </tbody>
        </table>
      </div>

      <h3>9.2 · The decision flowchart</h3>
      <Flowchart />

      <h3>9.3 · Pitfalls worth avoiding</h3>
      <ol className="steps">
        <li>
          <strong>Watching only the average loss.</strong> A great L₀ can hide a task that was quietly
          sacrificed. Always report per-task numbers too, ideally the average per-task drop against
          single-task baselines.
        </li>
        <li>
          <strong>Cutting gradients in the task-specific heads.</strong> Heads share no parameters, so
          there is nothing to fight over. Combine gradients on the shared trunk only.
        </li>
        <li>
          <strong>Forgetting GradNorm's renormalization.</strong> Without it, the weights slowly change
          the overall learning speed, and your comparison against baselines stops meaning anything.
        </li>
        <li>
          <strong>Running full K-task surgery on a 50-task problem.</strong> K backward passes per step
          is the real price of PCGrad and CAGrad. Use task subsampling (CAGrad-Fast) or a fast method.
        </li>
        <li>
          <strong>Treating every conflict as poison.</strong> The tragic triad says conflict mostly
          hurts when it comes with a loudness gap and high curvature. Mild conflict between equals is
          often harmless.
        </li>
      </ol>

      <h3>9.4 · Questions from real deployments</h3>
      <p>
        <strong>"Our tasks have disjoint datasets — does this still apply?"</strong> Yes, and this is
        the most common misconception. Every task can have its own dataset and its own head; the
        gradients still meet in one place — the shared backbone. Conflict is a property of gradients on
        shared parameters, not of shared data. The per-task dataset, per-task head, shared-trunk setup
        is the standard case these methods were built on. They would only become irrelevant if the tasks
        shared nothing at all — and then it would not be multitask learning. To convince a skeptic, log
        the cosine similarity between pairs of task gradients on the shared trunk for a few hundred
        steps. If the cosines go negative (and they almost always do), the conflict is real.
      </p>
      <p>
        <strong>"What if one task's batch is much smaller?"</strong> A small batch makes a task's
        gradient jittery: averaged over 8 examples instead of 128, the direction swings step to step,
        even though it is honest on average. Plain averaging just absorbs the noise. GradNorm
        occasionally turns a knob on a bad reading but self-corrects. PCGrad sometimes cuts against a
        fight that was not real — wasteful, not dangerous. CAGrad is the most sensitive: its whole
        decision is "who is worst off right now," and a jittery signal sometimes makes the small-batch
        task look worst-off when it simply had an unlucky batch — the leash caps how far one noisy step
        can pull the update. The fixes, in rough order of importance:
      </p>
      <ol className="steps">
        <li>
          <strong>Oversample the small task.</strong> Going from 8 to 32 samples per step already helps
          a lot. No algorithmic patch beats a steadier signal.
        </li>
        <li>
          <strong>Smooth the decision signal.</strong> Keep an exponential moving average of each task's
          gradient (decay 0.9–0.99), decide on the smoothed gradients, step with the real ones.
          Composes cleanly with CAGrad: it keeps the protection and the guarantee but stops reacting to
          one unlucky batch.
        </li>
        <li>
          <strong>Tighten the leash.</strong> If you cannot oversample, use a smaller c (0.3 to 0.5) —
          every step stays closer to the plain average.
        </li>
        <li>
          <strong>Log the variance, not just the average.</strong> If the small task's gradient norm
          swings wildly over a few dozen steps, you have confirmed a shaky signal before it confuses
          the algorithm.
        </li>
      </ol>
      <p>
        <strong>GradVac versus CAGrad here:</strong> not competitors. GradVac is a direction-fixer with
        a memory — it smooths the conflict signal but has no opinion about which task deserves help and
        no guarantee. CAGrad actively protects the worst-off task and proves it makes progress. If your
        small-batch task is also your struggling task (common), CAGrad addresses the real problem. The
        best arrangement combines them: CAGrad as the decision-maker, GradVac-style averaging inside the
        measurements it decides on.
      </p>

      <h3>9.5 · How to batch the data</h3>
      <ol className="steps">
        <li>
          <strong>Joint batch — all tasks every step (the standard, and the recommendation).</strong>{" "}
          Each task produces a loss and a gradient on the shared trunk at the same weights at the same
          moment, which is exactly what "do these gradients fight?" and "which task is worst off?"
          require.
        </li>
        <li>
          <strong>Round robin — one task per step.</strong> The methods become no-ops: no pair to
          de-conflict, no worst-off task to find. Worse, round robin does not remove the conflict — it
          spreads it across time, as the backbone zigzags between tasks, the same pacing that traps
          plain gradient descent. It removes the diagnostic, not the disease.
        </li>
        <li>
          <strong>Random task per step.</strong> Same problem as round robin, shuffled. Incompatible
          with gradient-combining methods.
        </li>
      </ol>

      <BatchingWidget />

      <p>
        Within a joint batch, prefer <strong>equal shares per task</strong>, oversampling small
        datasets so every gradient is measured with equal reliability — the whole point is to let the
        gradients decide the weighting, which only works if every gradient is trustworthy. If repeating
        a small dataset worries you, cap the repetition (e.g. no task repeats its data more than three
        times per epoch of the largest) rather than shrinking its share. And if a joint batch does not
        fit in memory, <strong>accumulate</strong>: run each task's sub-batch, store its gradient, and
        combine once all tasks have reported. PCGrad and CAGrad need all task gradients before combining
        anyway, so accumulation changes where you pay the memory cost, not whether you pay it.
      </p>

      <h3>9.6 · Which losses to bring</h3>
      <p>
        A common situation: each team arrives with its own mature single-task model, trained with half a
        dozen losses. Should all of them come into multitask training? <strong>No.</strong> The backbone
        is the only shared, one-shot resource in the whole system. After multitask training, a team
        takes the backbone, freezes it, and fine-tunes its own head privately, where it can use whatever
        losses it wants. So each loss faces one question:{" "}
        <em>does this loss need to shape the shared features, or can it do its job later, on the frozen
        backbone, inside my own head?</em>
      </p>
      <p>
        Extra losses are expensive: every added loss is another gradient pulling the trunk; the cost is
        paid by every team, not just the one who brought it; and the loss weights a team tuned for its
        single-task model no longer mean anything once GradNorm's knobs or CAGrad's leash are involved.
        The practical filter — the <strong>frozen-head test</strong>:
      </p>
      <ol className="steps">
        <li><strong>Baseline.</strong> Multitask-train with each task contributing exactly one loss, its main one. Measure every task's metric.</li>
        <li><strong>Frozen-head check.</strong> Freeze the backbone; each team fine-tunes its head with its full private stack. Measure again.</li>
        <li><strong>Gap analysis.</strong> If frozen-head fine-tuning reaches the target, the extra losses were head-level and stay private. If the metric is stuck no matter what the head does, the backbone never learned something the task needs — that loss belongs in multitask training.</li>
        <li><strong>Admit one loss at a time, and re-run.</strong> Confirm it closes the gap, and check the other tasks' metrics did not degrade.</li>
      </ol>

      <FrozenHeadTest />
      <LossStackLandscape />

      <Intuition>
        <p>
          Tips that save real time: start with one loss per task, no exceptions — the minimal baseline
          is the control group that makes every later decision measurable. Freeze the backbone before
          you argue. Keep the receipt when a loss joins (other tasks' metrics and the conflict rate,
          before and after). Pre-combine a task's main and auxiliary losses with fixed weights from its
          single-task tuning history, so the multitask trainer sees one voice per task. And let the
          conflict measurements referee team debates. Re-run the frozen-head check after big changes —
          the verdict on a loss is not permanent.
        </p>
      </Intuition>
    </div>
  );
}
