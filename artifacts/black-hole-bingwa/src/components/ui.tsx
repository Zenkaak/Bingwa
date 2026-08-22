import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

export function Button({ children, className = '', loading, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return <button {...props} disabled={props.disabled || loading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55 ${className}`} data-loading={loading || undefined}>
    {loading && <LoaderCircle className="size-4 animate-spin" />}{children}
  </button>;
}

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="grid gap-2 text-sm font-semibold text-foreground">
    <span className="flex items-center justify-between">{label}{hint && <span className="font-normal text-muted-foreground">{hint}</span>}</span>
    <input {...props} className={`h-12 rounded-xl border border-input bg-card px-3.5 text-[15px] font-medium outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/15 ${props.className || ''}`} />
  </label>;
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="flex items-end justify-between gap-4">
    <div>{eyebrow && <p className="mb-2 font-mono-app text-[10px] font-medium uppercase tracking-[.2em] text-secondary">{eyebrow}</p>}<h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{title}</h2></div>{children}
  </div>;
}

export function Skeleton({ className = '' }: { className?: string }) { return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />; }