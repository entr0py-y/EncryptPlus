import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono tracking-tight transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400",
  {
    variants: {
      variant: {
        default:
          "border border-zinc-800 bg-zinc-900 text-zinc-200",
        yellow:
          "border border-yellow-500/30 dark:border-yellow-400/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-semibold",
        secondary:
          "border border-zinc-800/60 bg-zinc-950 text-zinc-400",
        outline:
          "border border-zinc-700 text-zinc-300",
        solid:
          "bg-zinc-100 text-zinc-950 font-semibold border border-white",
        muted:
          "border border-zinc-900 bg-zinc-900/40 text-zinc-500",
        critical:
          "border border-rose-500/40 bg-rose-500/15 text-rose-400 font-bold",
        high:
          "border border-orange-500/40 bg-orange-500/15 text-orange-400 font-semibold",
        medium:
          "border border-yellow-500/40 bg-yellow-500/15 text-yellow-400 font-medium",
        low:
          "border border-zinc-800 bg-zinc-900/60 text-zinc-400",
        info:
          "border border-zinc-800/80 bg-zinc-950/60 text-zinc-400",
        vulnerable:
          "border border-rose-500/40 bg-rose-500/15 text-rose-400 font-bold",
        partial:
          "border border-yellow-500/40 bg-yellow-500/15 text-yellow-400 font-semibold",
        safe:
          "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
