import { useState } from "react";
import Why from "./sections/Why";
import Problem from "./sections/Problem";
import MathKit from "./sections/MathKit";
import Pareto from "./sections/Pareto";
import Playground from "./sections/Playground";
import GradNormTab from "./sections/GradNormTab";
import PCGradTab from "./sections/PCGradTab";
import GradVacTab from "./sections/GradVacTab";
import CAGradTab from "./sections/CAGradTab";
import UncertaintyTab from "./sections/UncertaintyTab";
import CompareTab from "./sections/CompareTab";
import FieldGuide from "./sections/FieldGuide";
import Beyond from "./sections/Beyond";

const TABS = [
  { id: "why", label: "Why", color: "#c0924e", el: <Why /> },
  { id: "problem", label: "Problem", color: "#f0927e", el: <Problem /> },
  { id: "math", label: "Math Kit", color: "#cbc6b9", el: <MathKit /> },
  { id: "pareto", label: "Pareto", color: "#e9b949", el: <Pareto /> },
  { id: "playground", label: "▶ Playground", color: "#c0924e", el: <Playground /> },
  { id: "gradnorm", label: "GradNorm", color: "#c6a1ce", el: <GradNormTab /> },
  { id: "pcgrad", label: "PCGrad", color: "#aaf7b3", el: <PCGradTab /> },
  { id: "gradvac", label: "GradVac", color: "#8ab2d1", el: <GradVacTab /> },
  { id: "cagrad", label: "CAGrad", color: "#efedbd", el: <CAGradTab /> },
  { id: "uncertainty", label: "Uncertainty", color: "#8ac1a0", el: <UncertaintyTab /> },
  { id: "compare", label: "Compare", color: "#cbc6b9", el: <CompareTab /> },
  { id: "guide", label: "Field Guide", color: "#cbc6b9", el: <FieldGuide /> },
  { id: "beyond", label: "Beyond + Glossary", color: "#cbc6b9", el: <Beyond /> },
];

export default function App() {
  const initial = new URLSearchParams(window.location.search).get("tab");
  const [active, setActive] = useState(TABS.some((t) => t.id === initial) ? initial! : "why");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div>
      <header style={{ padding: "34px 20px 18px", textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          interactive edition · multitask learning
        </div>
        <h1
          style={{
            color: "var(--lighter)",
            fontWeight: 700,
            fontSize: "clamp(28px, 7vw, 44px)",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
          }}
        >
          When Tasks Collide
        </h1>
        <p className="dim small" style={{ maxWidth: 560, margin: "8px auto 0" }}>
          The geometry of conflicting gradients — and how GradNorm, PCGrad, and CAGrad turn a crowd of
          competing objectives into a team that trains as one. Every equation unpacked, every method
          playable.
        </p>
      </header>

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${active === t.id ? "active" : ""}`}
              onClick={() => {
                setActive(t.id);
                window.scrollTo({ top: 0 });
              }}
            >
              <span className="dot" style={{ background: t.color, opacity: active === t.id ? 1 : 0.4 }} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="shell">{tab.el}</main>

      <footer className="shell" style={{ paddingBottom: 40 }}>
        <hr className="hr" />
        <p className="small dim" style={{ textAlign: "center" }}>
          An interactive companion to the white paper · every number recomputed, every method runnable
          in your browser
        </p>
      </footer>
    </div>
  );
}
