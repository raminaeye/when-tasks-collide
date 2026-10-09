import type { ReactNode } from "react";

export function Eq({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <>
      <span className="eq">{children}</span>
      {caption && <p className="eq-caption">{caption}</p>}
    </>
  );
}

export function Intuition({ children }: { children: ReactNode }) {
  return (
    <div className="box box-intuition">
      <div className="box-label">Intuition</div>
      {children}
    </div>
  );
}

export function Worked({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="box box-worked">
      <div className="box-label">Worked example{title ? ` · ${title}` : ""}</div>
      {children}
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return <pre className="codeblock">{children}</pre>;
}

export function TabHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ margin: "34px 0 20px" }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="tab-title">{title}</h2>
      {children && <p className="lede">{children}</p>}
    </div>
  );
}
