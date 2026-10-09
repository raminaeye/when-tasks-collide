import { TabHead, Intuition } from "../components/bits";

const GLOSSARY: [string, string][] = [
  ["Argmin / argmax", "The knob position that gives the best score, not the score itself. minₓ f(x) is the lowest value f ever reaches; argminₓ f(x) is the x that gets you there."],
  ["Conflicting gradients", "Two task gradients that point against each other (angle wider than 90°, cosine negative). Following their sum can push one task's loss up."],
  ["Convex combination / simplex", "A blend where every weight is ≥ 0 and the weights sum to 1. Each task gets a percentage of the mix. With two tasks: w·g₁ + (1−w)·g₂. The simplex Δ is the set of all legal weight lists."],
  ["Dot product", "Multiply matching entries and add: ⟨(3,1),(−1,2)⟩ = −3+2 = −1. Its sign is an agreement meter: positive = pulling together, zero = perpendicular, negative = opposed. Formally ⟨u,v⟩ = ‖u‖‖v‖cosθ."],
  ["Gradient", "The arrow ∇L(θ) that points straight uphill on the loss landscape; training follows −∇L downhill."],
  ["Gradient norm", "The length ‖g‖ of a gradient: how 'loudly' a task speaks in the shared update. A task with a 300× larger norm gets 300× more say."],
  ["Gradient Vaccine (GradVac)", "A generalization of PCGrad: instead of pushing every conflicting pair to cosine zero, each task pair gets its own target cosine (a running average of its historical alignment), and gradients are nudged back to that target whenever they sag below it."],
  ["Hard parameter sharing", "One shared trunk, small task-specific heads. The trunk's parameters receive every task's gradient — which is where conflicts happen."],
  ["Inverse training rate", "GradNorm's progress meter: L̃ᵢ(t) = Lᵢ(t)/Lᵢ(0), the fraction of the way a task has come down. L̃ᵢ = 0.25 means three quarters of the journey is done."],
  ["Linear scalarization", "The obvious multitask recipe: squash all the losses into one number, ΣwᵢLᵢ, and run ordinary gradient descent on it."],
  ["Lipschitz smoothness (H)", "A budget on curvature: the gradient changes at a rate of at most H as you move, so step sizes up to 1/H are provably safe. Used by CAGrad's guarantee."],
  ["MGDA", "Multiple-gradient descent algorithm: each step descends along the shortest legal blend of the task gradients. Guaranteed to converge to some Pareto-stationary point, but which one depends on where you started."],
  ["Negative transfer", "When training tasks together makes them worse than training them separately. The disease this whole guide is about."],
  ["Norm", "The length of a vector: ‖(3,1)‖ = √(3²+1²) ≈ 3.16."],
  ["Normal plane", "All the directions perpendicular to gⱼ. Moving along them neither helps nor hurts task j — which is why PCGrad projects conflicting gradients onto it."],
  ["Pareto-optimal / Pareto set", "A point where no task can improve without another getting worse. The set of all such points: the menu of all fair trade-offs."],
  ["Pareto-stationary", "A point where some blend of the task gradients cancels out to exactly zero — the multitask version of 'gradient equals zero.' Every Pareto-optimal point is Pareto-stationary, but not the other way around."],
  ["Projection", "The shadow one vector casts on another's line. Subtracting the shadow leaves the perpendicular part."],
  ["Tragic triad", "The PCGrad paper's name for the three ingredients that make conflict truly harmful: gradients that fight, one gradient much louder than the other, and a sharply curved landscape."],
  ["Trust region (CAGrad's ball)", "The set of update directions within distance c‖g₀‖ of the average gradient. The leash CAGrad puts on its correction."],
  ["Vector", "A list of numbers, pictured as an arrow. A model's parameters form one very long vector (millions of entries), and a gradient is an arrow of the same length."],
];

const REFS = [
  "Caruana, R. (1997). Multitask learning. Machine Learning, 28(1), 41–75.",
  "Chen, Z., Badrinarayanan, V., Lee, C.-Y., & Rabinovich, A. (2018). GradNorm. ICML, PMLR 80, 794–803.",
  "Yu, T., Kumar, S., Gupta, A., Levine, S., Hausman, K., & Finn, C. (2020). Gradient surgery for multi-task learning (PCGrad). NeurIPS 33.",
  "Liu, B., Liu, X., Jin, X., Stone, P., & Liu, Q. (2021). Conflict-averse gradient descent (CAGrad). NeurIPS 34.",
  "Kendall, A., Gal, Y., & Cipolla, R. (2018). Multi-task learning using uncertainty to weigh losses. CVPR, 7482–7491.",
  "Sener, O., & Koltun, V. (2018). Multi-task learning as multi-objective optimization. NeurIPS 31.",
  "Désidéri, J.-A. (2012). Multiple-gradient descent algorithm (MGDA). Comptes Rendus Mathematique, 350(5–6), 313–318.",
  "Ruder, S. (2017). An overview of multi-task learning in deep neural networks. arXiv:1706.05098.",
  "Crawshaw, M. (2020). Multi-task learning with deep neural networks: A survey. arXiv:2008.11044.",
  "Vandenhende, S., et al. (2022). Multi-task learning for dense prediction tasks: A survey. IEEE TPAMI, 44(7), 3614–3633.",
  "Zhang, Y., & Yang, Q. (2022). A survey on multi-task learning. IEEE TKDE, 34(12), 5586–5609.",
  "Chen, Z., et al. (2020). Just pick a sign (GradDrop). NeurIPS 33.",
  "Liu, L., et al. (2021). Towards impartial multi-task learning (IMTL-G). ICLR.",
  "Javaloy, A., & Valera, I. (2022). RotoGrad: Gradient homogenization in multitask learning. ICLR.",
  "Wang, Z., Tsvetkov, Y., Firat, O., & Cao, Y. (2021). Gradient vaccine (GradVac). ICLR.",
  "Navon, A., et al. (2022). Multi-task learning as a bargaining game (Nash-MTL). ICML.",
  "Liu, B., Feng, Y., Stone, P., & Liu, Q. (2023). FAMO: Fast adaptive multitask optimization. NeurIPS 36.",
  "Maninis, K.-K., Radosavovic, I., & Kokkinos, I. (2019). Attentive single-tasking of multiple tasks. ICCV, 1851–1860.",
  "Kingma, D. P., & Ba, J. (2015). Adam: A method for stochastic optimization. ICLR.",
  "Lin, X., et al. (2019). Pareto multi-task learning. NeurIPS 32.",
];

export default function Beyond() {
  return (
    <div className="fadein">
      <TabHead eyebrow="Part IV · §10 + back matter" title="Beyond the big three — and what they cannot fix">
        Research has kept moving since 2021, and it is just as important to know what none of these
        methods can do.
      </TabHead>

      <h3>A one-line tour of newer methods</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Method</th><th>Idea in one line</th></tr></thead>
          <tbody>
            <tr><td><strong>GradDrop</strong></td><td>Randomly drops gradient entries where tasks disagree about the sign.</td></tr>
            <tr><td><strong>IMTL-G</strong></td><td>Looks for an update that helps every task by the same amount.</td></tr>
            <tr><td><strong>RotoGrad</strong></td><td>Rotates and rescales task gradients to make them more alike.</td></tr>
            <tr><td><strong>Nash-MTL</strong></td><td>Treats the update as a bargaining game among the tasks.</td></tr>
            <tr><td><strong>FAMO</strong></td><td>Balances tasks with almost no extra cost per step — makes many-task problems cheap.</td></tr>
          </tbody>
        </table>
      </div>
      <p>Different machinery, same core ideas as this guide: scales, speeds, and directions.</p>

      <h3>What none of them can fix</h3>
      <p>
        Gradient-level fixes <strong>redistribute a shortage; they do not remove it</strong>. If the
        shared trunk is simply too small to hold all the tasks, or the tasks genuinely work against each
        other, no optimizer can fix it. The limit is then set by the architecture (wider trunks, softer
        sharing, task-specific modules) and by task grouping (which tasks should share at all).
        Optimization methods decide how well you use the sharing you chose; they cannot choose it for
        you. Open problems include objectives beyond the plain average (letting users set priorities),
        guarantees that hold with noisy gradients and many tasks, and principled ways to combine
        weighting, surgery, and architecture choices.
      </p>

      <Intuition>
        <p>
          <strong>The one-paragraph summary.</strong> Multitask training fails quietly, in three ways:
          one task can be so loud it drowns the rest (scale), tasks can learn at different speeds so a
          fixed balance is always wrong for someone (speed), and tasks can pull in opposite directions
          (direction). GradNorm fixes the first two by learning a volume knob per task. PCGrad fixes the
          third by cutting the part of each gradient that fights another task. CAGrad fixes the third
          with a guarantee: help the worst-off task as much as possible without straying far from the
          average, and you provably keep improving the loss you set out to minimize. Diagnose with
          gradient norms and cosines, then pick your medicine.
        </p>
      </Intuition>

      <hr className="hr" />
      <h3>Glossary</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <tbody>
            {GLOSSARY.map(([term, def]) => (
              <tr key={term}>
                <td style={{ whiteSpace: "nowrap", color: "var(--lighter)", fontWeight: 600, width: "1%" }}>{term}</td>
                <td className="dim">{def}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>References</h3>
      <ol className="small dim" style={{ paddingLeft: 22, lineHeight: 1.8 }}>
        {REFS.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ol>
    </div>
  );
}
