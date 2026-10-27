import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono tracking-tight transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400",
  {
    variants: {
      variant: {
        default:
          "border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200",
        yellow:
          "border border-amber-300 dark:border-yellow-400/30 bg-amber-50 dark:bg-yellow-500/10 text-amber-800 dark:text-yellow-400 font-semibold",
        secondary:
          "border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400",
        outline:
          "border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-transparent text-zinc-800 dark:text-zinc-300",
        solid:
          "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold border border-transparent",
        muted:
          "border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-500",
        critical:
          "border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold",
        high:
          "border border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 font-semibold",
        medium:
          "border border-amber-300 dark:border-yellow-500/40 bg-amber-50 dark:bg-yellow-500/15 text-amber-800 dark:text-yellow-400 font-medium",
        low:
          "border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-400",
        info:
          "border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950/60 text-zinc-700 dark:text-zinc-400",
        vulnerable:
          "border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold",
        partial:
          "border border-amber-300 dark:border-yellow-500/40 bg-amber-50 dark:bg-yellow-500/15 text-amber-800 dark:text-yellow-400 font-semibold",
        safe:
          "border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-semibold",
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
