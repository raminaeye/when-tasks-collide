import { TabHead, Intuition } from "../components/bits";

export default function CompareTab() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part IV · §8" title="Side by side: a comparison and a map of the field">
        Step back and the methods are answering different questions. GradNorm asks "how loud should each
        task be?" Uncertainty weighting asks the same but answers from the data's noise. PCGrad asks "is
        my step hurting you?" CAGrad asks "how do I help the worst-off task without losing sight of the
        goal?"
      </TabHead>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Method</th>
              <th>What it edits</th>
              <th>Key idea</th>
              <th>Knobs</th>
              <th>Guarantee</th>
              <th>Extra cost / best for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Equal weights</strong></td>
              <td>—</td>
              <td>Sum the losses and hope</td>
              <td>—</td>
              <td>—</td>
              <td>None. Baseline; fine when tasks are similar in scale, speed, and direction.</td>
            </tr>
            <tr>
              <td><strong style={{ color: "var(--uncertainty)" }}>Uncertainty</strong></td>
              <td>loss weights</td>
              <td>Weight each task by learned homoscedastic uncertainty</td>
              <td>init σᵢ</td>
              <td>probabilistic motivation</td>
              <td>Low. A principled reweighting alternative to GradNorm.</td>
            </tr>
            <tr>
              <td><strong style={{ color: "var(--gradnorm)" }}>GradNorm</strong></td>
              <td>loss weights</td>
              <td>Equalize gradient norms; boost tasks training slowly</td>
              <td>α, λ_w</td>
              <td>none (heuristic)</td>
              <td>~5–25%. Scale/speed imbalance, e.g. dense vision tasks.</td>
            </tr>
            <tr>
              <td><strong>MGDA</strong></td>
              <td>update direction</td>
              <td>Minimum-norm blend of task gradients</td>
              <td>—</td>
              <td>converges to <em>some</em> Pareto-stationary point</td>
              <td>K backward passes + small solve. Theory-minded baselines.</td>
            </tr>
            <tr>
              <td><strong style={{ color: "var(--pcgrad)" }}>PCGrad</strong></td>
              <td>update direction</td>
              <td>Project out the mutually conflicting components</td>
              <td>none</td>
              <td>local improvement under the "tragic triad"; arbitrary Pareto point</td>
              <td>K backward passes. Conflict-heavy problems, multi-task RL.</td>
            </tr>
            <tr>
              <td><strong style={{ color: "var(--gradvac)" }}>GradVac</strong></td>
              <td>update direction</td>
              <td>Pull each pair's cosine up to its own running target, not a blanket zero</td>
              <td>β, task subset, granularity</td>
              <td>none (heuristic)</td>
              <td>K backward passes. Many unequally-related tasks, e.g. multilingual models.</td>
            </tr>
            <tr>
              <td><strong style={{ color: "var(--cagrad)" }}>CAGrad</strong></td>
              <td>update direction</td>
              <td>Maximize worst-task improvement within a ball around g₀</td>
              <td>c ∈ [0,1)</td>
              <td>converges to a stationary point of L₀ (for c &lt; 1)</td>
              <td>K backward passes + tiny solve. When consistency and the objective matter.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Where they land on the toy (loss space)</h3>
      <p>
        On the toy landscape of the CAGrad tab, plotting only where each 100,000-step run ends: GD —
        three runs stall far above the Pareto set, oscillating forever, two reach it. MGDA and PCGrad —
        four of five reach the Pareto set but land <strong>scattered along it</strong>: every landing
        spot is a valid trade-off, yet the initialization does the choosing. CAGrad — four of five runs
        land exactly on the ★, stacked on top of each other. And as c varies: c = 0 inherits GD's
        stalled runs, c = 10 inherits MGDA's spread, every mid-range c stacks on the star.
      </p>

      <h3>The two families are teammates, not rivals</h3>

      {/* field map */}
      <svg viewBox="0 0 600 260" style={{ width: "100%", background: "var(--bg-tinted)", borderRadius: 14, border: "1px solid rgba(203,198,185,.12)", margin: "16px 0" }}>
        <text x={150} y={30} textAnchor="middle" fill="#c0924e" fontSize={11} letterSpacing={3}>REWEIGHT THE LOSSES</text>
        <text x={450} y={30} textAnchor="middle" fill="#c0924e" fontSize={11} letterSpacing={3}>RESHAPE THE UPDATE VECTOR</text>
        <line x1={300} y1={45} x2={300} y2={245} stroke="rgba(203,198,185,.15)" strokeDasharray="4 5" />
        {[
          { x: 150, y: 70, t: "Static / hand-tuned", c: "#cbc6b9", op: 0.5 },
          { x: 150, y: 115, t: "Uncertainty weighting", c: "#8ac1a0", op: 1 },
          { x: 150, y: 160, t: "GradNorm", c: "#c6a1ce", op: 1 },
          { x: 450, y: 70, t: "MGDA", c: "#e9b949", op: 1 },
          { x: 450, y: 115, t: "PCGrad", c: "#aaf7b3", op: 1 },
          { x: 450, y: 160, t: "GradVac", c: "#8ab2d1", op: 1 },
          { x: 450, y: 205, t: "CAGrad", c: "#efedbd", op: 1 },
        ].map((n) => (
          <g key={n.t}>
            <rect x={n.x - 105} y={n.y - 17} width={210} height={34} rx={8} fill="none" stroke={n.c} strokeOpacity={0.4 + 0.4 * n.op} />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fill={n.c} fontSize={13}>{n.t}</text>
          </g>
        ))}
        <text x={150} y={225} textAnchor="middle" fill="rgba(203,198,185,.45)" fontSize={11}>how loud should each task be?</text>
        <text x={450} y={245} textAnchor="middle" fill="rgba(203,198,185,.45)" fontSize={11}>which direction should the step actually point?</text>
      </svg>

      <Intuition>
        <p>
          Reweighting fixes how loud the tasks are; surgery fixes the direction they pull; nothing stops
          you from doing both. Feeding GradNorm's weights into PCGrad's cuts is a common combination,
          and GradVac gives the pairing a principled form. Zooming out one more level: all of these are{" "}
          <strong>multitask optimization</strong> methods — they change how the model is trained, not
          what the model is. Changing the model itself (cross-stitch networks, MTAN) is a separate
          toolbox.
        </p>
      </Intuition>
    </div>
  );
}
