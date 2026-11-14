import type { ReactNode } from "react";

type FoundationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function FoundationPage({
  eyebrow,
  title,
  description,
  children,
}: FoundationPageProps) {
  return (
    <div className="foundation-page">
      <header className="foundation-page__header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="foundation-page__lead">{description}</p>
      </header>
      {children}
    </div>
  );
}
