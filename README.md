# When Tasks Collide

An interactive guide to **multitask learning**: the geometry of conflicting gradients, and how the classic methods turn competing objectives into a team that trains as one.

Live: https://vqcvagruxu2pa.kimi.page

## What it covers

Thirteen tabs, three reading tracks (15-minute commuter, 45-minute practitioner, half-day full climb):

| Tab | Content |
|---|---|
| Why | Why train one model on many tasks; hard parameter sharing |
| Problem | Where naive joint training breaks |
| Math Kit | The symbols and operations, unpacked |
| Pareto | Trade-offs and the Pareto front |
| Playground | Drag task gradients around; compare GD, PCGrad, MGDA, CAGrad live |
| GradNorm | Balancing task loudness |
| PCGrad | Gradient surgery on conflicting directions |
| GradVac | Adaptive cosine targets per task pair |
| CAGrad | Worst-task improvement within a trust region |
| Uncertainty | Homoscedastic uncertainty weighting |
| Compare | Side-by-side table, toy-landscape results, field map |
| Field Guide | Practical rules for real multitask training |
| Beyond + Glossary | Where to go next, terms defined |

Every method tab follows the same arc: intuition first, then the geometry, a worked numeric example you can check by hand, an animated or playable demo, the algorithm as runnable NumPy code, and practical notes on when it pays off.

## The interactive pieces

- **Gradient playground**: drag two task-gradient arrows and watch GD / PCGrad / MGDA / CAGrad combine them, with betrayal-zone shading and per-task scores.
- **PCGrad surgery**: the four-beat projection sequence, stepped through with the worked example's exact vectors.
- **Landscape racer**: GD, MGDA, PCGrad, and CAGrad racing on the two-task toy landscape from the CAGrad paper's appendix, with loss curves.
- **Blend explorer**: slide along the gradient simplex and find the min-norm point MGDA takes.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Stack

React + TypeScript + Vite, Tailwind CSS v3, shadcn/ui components. No backend; everything runs in the browser.

## Companion paper

Based on the white paper "When Tasks Collide" (Ramin Anushiravani, September 2026). Every worked example is recomputed with real numbers.
