import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[var(--color-navy-surface)]/90 p-5 shadow-2xl backdrop-blur-md">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
