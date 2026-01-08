import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition " +
    "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  const variants: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border bg-background hover:bg-muted",
    ghost: "hover:bg-muted",
  };

  const sizes: Record<Size, string> = {
    default: "h-10 px-4",
    sm: "h-8 px-3 text-xs",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
