import { TabHead, Intuition } from "../components/bits";
import GradientPlayground from "../components/GradientPlayground";

export default function Playground() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Interactive" title="The gradient playground">
        Two tasks, two gradient arrows — drag them. Switch the combination rule and watch which tasks
        the resulting update actually helps. Everything the four methods do, in one sandbox.
      </TabHead>

      <Intuition>
        <p>
          The <strong>score</strong> ⟨d, gᵢ⟩ is the referee from §3.2: positive means the step pushes
          task i's loss down. The <strong>betrayal zones</strong> (shaded half-planes) show every
          direction that would hurt a task. A good method's gold arrow never ends in a shaded zone.
        </p>
      </Intuition>

      <GradientPlayground />

      <h3>What to try</h3>
      <ol className="steps">
        <li>
          Load <strong>"Paper §5"</strong> and flip between Plain sum and PCGrad. The naive sum (2, 3)
          helps both tasks here — but watch the dashed edited gradients land at exact right angles to
          the task they were cut against.
        </li>
        <li>
          Load <strong>"Loud vs quiet."</strong> Now the plain sum gets dragged by the big gradient and
          the pink zone eats it: task 1's score goes negative. PCGrad, MGDA, and CAGrad all fix it —
          differently.
        </li>
        <li>
          Switch to <strong>CAGrad</strong> and slide c from 0 to 1.5. At 0 the update collapses onto
          the average (plain GD); as it grows, the dashed leash circle widens and the update tilts
          toward the worst-off task.
        </li>
        <li>
          Load <strong>"Allies"</strong>: with cos ≥ 0, PCGrad and GD coincide — when nobody fights,
          surgery does nothing. Cooperation costs nothing.
        </li>
        <li>
          Drag the handles yourself. Find a configuration where MGDA's arrow nearly vanishes — that is
          a Pareto-stationary point, a standoff where the shortest blend has length ≈ 0.
        </li>
      </ol>
    </div>
  );
}
