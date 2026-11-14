import type { ReactNode } from "react";

import "../globals.css";

type RedirectLayoutProps = {
  children: ReactNode;
};

export default function RedirectLayout({ children }: RedirectLayoutProps) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
