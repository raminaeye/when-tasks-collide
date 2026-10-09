import { TabHead, Intuition } from "../components/bits";

export default function Why() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part I · §1" title="Why teach one model many things?">
        Most machine learning does one thing at a time: one dataset, one loss, one skill. Multitask
        learning does the opposite on purpose — one model, several tasks, hoping each task helps the
        others learn.
      </TabHead>

      <p>
        The idea is old by deep-learning standards. Back in <strong>1997</strong>, Rich Caruana noticed
        something striking: a network taught to recognize <em>doors</em> got better at doors when it was
        also taught to recognize <em>doorknobs</em>. The second task pushed the network to pay attention
        to the features that really matter (shapes, edges, handles) and ignore the noise. Thirty years of
        work in vision, language, and robotics has kept rediscovering the same lesson.
      </p>

      <h3>The workhorse: hard parameter sharing</h3>
      <p>
        One shared <strong>trunk</strong> learns to make sense of the input, and a small task-specific{" "}
        <strong>head</strong> per task turns that understanding into an answer.
      </p>

      {/* Architecture diagram, SVG */}
      <svg viewBox="0 0 600 300" style={{ width: "100%", background: "var(--bg-tinted)", borderRadius: 14, border: "1px solid rgba(203,198,185,.12)", margin: "16px 0" }}>
        <defs>
          <marker id="aw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#cbc6b9" />
          </marker>
        </defs>
        <rect x={30} y={110} width={90} height={50} rx={10} fill="none" stroke="#cbc6b9" strokeWidth={1.5} />
        <text x={75} y={138} textAnchor="middle" fill="#cbc6b9" fontSize={13}>input</text>
        <line x1={120} y1={135} x2={180} y2={135} stroke="#cbc6b9" markerEnd="url(#aw)" />
        <rect x={180} y={90} width={140} height={90} rx={12} fill="rgba(192,146,78,.1)" stroke="#c0924e" strokeWidth={1.5} />
        <text x={250} y={127} textAnchor="middle" fill="#e9e7e2" fontSize={13}>shared trunk</text>
        <text x={250} y={147} textAnchor="middle" fill="#cbc6b9" fontSize={11} className="mono">θ_sh</text>
        {[0, 1, 2].map((i) => {
          const y = 30 + i * 75;
          return (
            <g key={i}>
              <line x1={320} y1={135} x2={385} y2={y + 20} stroke="#cbc6b9" markerEnd="url(#aw)" />
              <rect x={385} y={y} width={90} height={40} rx={9} fill="none" stroke="#cbc6b9" strokeWidth={1.5} />
              <text x={430} y={y + 25} textAnchor="middle" fill="#cbc6b9" fontSize={12}>head θ_{i + 1}</text>
              <line x1={475} y1={y + 20} x2={520} y2={y + 20} stroke="#cbc6b9" markerEnd="url(#aw)" />
              <text x={548} y={y + 25} textAnchor="middle" fill="#c0924e" fontSize={12} className="mono">L_{i + 1}</text>
              <line x1={520} y1={y + 33} x2={330} y2={y + 33} stroke="#f0927e" strokeDasharray="4 5" strokeWidth={1.2} opacity={0.8} />
            </g>
          );
        })}
        <text x={300} y={262} textAnchor="middle" fill="#f0927e" fontSize={11.5}>dashed: every task's gradient g_i flows back into the same shared parameters — where the trouble begins</text>
        <text x={300} y={282} textAnchor="middle" fill="rgba(203,198,185,.5)" fontSize={11.5}>solid: forward pass — one input through the trunk, each head produces its own loss</text>
      </svg>

      <h3>Why people like this design</h3>
      <ol className="steps">
        <li>
          <strong>It is cheaper.</strong> One trunk instead of K separate models means less memory, less
          compute, and one model to deploy. A self-driving car's vision system cannot afford ten networks
          per frame.
        </li>
        <li>
          <strong>Tasks teach each other.</strong> Labels for one task quietly act as training signal for
          the others. Knowing the depth of a scene helps with segmentation; knowing the segmentation
          helps with surface orientation.
        </li>
        <li>
          <strong>The model learns better features.</strong> A trunk that must please many tasks is pushed
          toward features that are useful in general — it cannot overfit the quirks of any single dataset.
          The extra tasks act like a built-in safety net.
        </li>
      </ol>

      <p>
        Once you know what to look for, this design is everywhere: scene understanding (one network
        predicts segmentation, depth, and surface normals), robot control (one policy handles 10–50
        tasks), multilingual language models (dozens of languages), recommendation systems that must
        care about clicks, watch time, and satisfaction all at once.
      </p>

      <Intuition>
        <p>
          <strong>The catch.</strong> Train the tasks together in the obvious way and you will often find
          that every task does worse than it would have on its own. The shared trunk is not a free lunch.
          It is a shared resource that the tasks fight over. This whole guide is about why that fight
          happens, and how the well-known methods calm it down.
        </p>
      </Intuition>

      <h3>Three ways to read this app</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Track</th><th>For</th><th>Path</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>The commuter</strong><br /><span className="dim small">15 min</span></td>
              <td>You want the ideas and the takeaway, no math</td>
              <td>Why → Problem → the Intuition boxes of GradNorm, PCGrad, CAGrad → Compare → Field Guide</td>
            </tr>
            <tr>
              <td><strong>The practitioner</strong><br /><span className="dim small">45 min</span></td>
              <td>You want to pick and apply a method this week</td>
              <td>All of the above, plus the math kit if any symbol is unfamiliar, the algorithm steps, the worked examples, and the playgrounds</td>
            </tr>
            <tr>
              <td><strong>The full climb</strong><br /><span className="dim small">half a day</span></td>
              <td>You want the derivations and the guarantees too</td>
              <td>Everything, including the deep-dive boxes, the guarantee in CAGrad, and every worked example checked by hand</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="dim small">
        Based on the white paper "When Tasks Collide" (Ramin Anushiravani, September 2026). Every
        equation here is unpacked symbol by symbol, and every worked example is recomputed with real
        numbers you can check.
      </p>
    </div>
  );
}
