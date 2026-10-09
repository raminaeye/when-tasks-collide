import { TabHead, Eq, Intuition, Code } from "../components/bits";
import GradVacDemo from "../components/GradVacDemo";

export default function GradVacTab() {
  return (
    <div className="fadein">
      <TabHead eyebrow="§5.4 · ICLR 2021" title="Gradient Vaccine: surgery with a target">
        PCGrad carries a quiet assumption: when two gradients fight, push every pair to the same place —
        a right angle. Zero is treated as the perfect relationship between any two tasks. GradVac asked:
        is zero actually the right target?
      </TabHead>

      <h3>The setting that exposed the assumption</h3>
      <p>
        One model, a hundred languages. Multilingual translation trains a single network on dozens of
        language pairs at once, and the tasks are wildly uneven: some have billions of sentence pairs,
        others millions; some pairs are close cousins (French and Spanish share vocabulary and grammar),
        others are strangers (French and Hindi). If any set of tasks should not share one universal
        target, it is this one.
      </p>

      <h3>The measurement that started it</h3>
      <p>
        Before fixing anything, the authors recorded what PCGrad never looks at: the cosine between
        every pair of task gradients, checkpoint by checkpoint, over entire training runs. Three things
        showed up:
      </p>
      <ol className="steps">
        <li>
          <strong>The pattern of cosines mirrors the language family tree.</strong> Romance languages
          align with each other, Slavic with Slavic — you can see the clusters with the naked eye.
        </li>
        <li>
          <strong>Alignment pays:</strong> in controlled two-language models, higher gradient cosine
          went hand in hand with better translation quality.
        </li>
        <li>
          <strong>Alignment is not one fixed number:</strong> it changes from layer to layer and drifts
          over training.
        </li>
      </ol>
      <p>
        Every task pair has its own natural level of cooperation: strongly positive for related tasks,
        near zero for distant ones. French and Spanish's gradients naturally agree, so PCGrad's alarm
        never goes off — and if it did, its target of zero would be a step <em>backwards</em>, blocking
        the very cooperation that lets related languages help each other. PCGrad can stop a fight, but
        it cannot notice that two friends have started cooperating less than they used to. Sure enough,
        PCGrad did nothing on most steps of multilingual training — no cosines were negative, yet a lot
        of help was being left on the table.
      </p>

      <h3>The fix: give each pair its own target</h3>
      <p>
        GradVac keeps a running estimate of what "normal" looks like for each pair — a slow-moving
        average of the cosines seen so far, tracked separately for each group of layers:
      </p>
      <Eq caption="β ≈ 10⁻²: slow enough that one noisy batch cannot move a target.">
        φ̂ᵢⱼ(t) = (1−β)·φ̂ᵢⱼ(t−1) + β·φᵢⱼ(t)
      </Eq>
      <p>
        Whenever the current cosine dips below this target, GradVac nudges gᵢ toward gⱼ by just enough
        to bring the pair back to normal — mixing in a little of the other gradient, gᵢ′ = gᵢ + a·gⱼ,
        with a solved so the new cosine equals φ̂ᵢⱼ exactly. If the pair is as aligned as usual, a = 0
        and nothing happens. If alignment starts to sag — the early warning sign of a fight that has not
        happened yet — gᵢ gets a small dose of the other task's gradient, pulling the pair back before
        the cosine can turn negative.
      </p>

      <Intuition>
        <p>
          That is where the name comes from: PCGrad operates <em>after</em> the fight breaks out
          (surgery); GradVac holds each pair at its healthy level so the fight never starts (a vaccine).
          PCGrad is literally the special case where the target is φ̂ᵢⱼ = 0 for every pair.
        </p>
      </Intuition>

      <h3>Feel the nudge</h3>
      <GradVacDemo />

      <h3>Algorithm 4 · per training step</h3>
      <ol className="steps">
        <li>Forward pass; compute each task loss Lᵢ.</li>
        <li>Compute each task gradient on the shared parameters, gᵢ.</li>
        <li>For each pair (i,j), measure the current cosine φᵢⱼ and update its running target: φ̂ᵢⱼ ← (1−β)φ̂ᵢⱼ + βφᵢⱼ.</li>
        <li>For each pair below its target, nudge gᵢ toward gⱼ by adding just enough of gⱼ to bring the pair back: gᵢ ← gᵢ + a·gⱼ.</li>
        <li>Step the network with the sum of the edited gradients.</li>
      </ol>

      <Code>
{`# grads = [g_1..g_K]; target[i,j] = running target cosine, init 0
for i, j in pairs:
    cos_ij = grads[i] @ grads[j] / (norm(grads[i]) * norm(grads[j]))
    target[i,j] = (1 - beta) * target[i,j] + beta * cos_ij  # slow running target
    if cos_ij < target[i,j]:                # fighting below their normal?
        a = solve_for_cosine(grads[i], grads[j], target[i,j])  # restoring blend
        grads[i] = grads[i] + a * grads[j]  # nudge, not a full cut
d = sum(grads)                              # combine the edited gradients`}
      </Code>

      <h3>Does it pay?</h3>
      <p>
        On small-scale WMT translation, GradVac beat the plain baseline and all three of GradNorm, MGDA,
        and PCGrad — on average and on <strong>every single language</strong>, which multitask methods
        rarely manage. On a 25-language-pair production benchmark the gains held up and were largest
        exactly where interference bites hardest: the high-resource languages. It also improved
        multilingual BERT on named-entity recognition. And the free side product: the pairwise-cosine
        log itself costs a few lines of code and draws you a map of how your tasks relate while you
        train — which is why the Field Guide puts it on the diagnose-first checklist.
      </p>

      <h3>The knobs</h3>
      <p>
        Three, and the paper's defaults all worked well: the averaging speed <strong>β</strong> (10⁻²
        was best); <strong>which tasks to vaccinate</strong> (only the low-resource ones — they have the
        most to gain from borrowed alignment); and <strong>granularity</strong> (one target per layer
        group beat one target for the whole model, matching the finding that alignment varies by layer).
      </p>
    </div>
  );
}
