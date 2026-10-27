import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono tracking-tight transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400",
  {
    variants: {
      variant: {
        default:
          "border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white",
        yellow:
          "border border-amber-300 dark:border-yellow-400/30 bg-amber-50 dark:bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 font-semibold",
        secondary:
          "border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100 dark:bg-zinc-950 text-black dark:text-white",
        outline:
          "border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-transparent text-black dark:text-white",
        solid:
          "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black font-semibold border border-transparent",
        muted:
          "border border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-900/40 text-black dark:text-white",
        critical:
          "border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 text-black dark:text-white font-bold",
        high:
          "border border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/15 text-black dark:text-white font-semibold",
        medium:
          "border border-amber-300 dark:border-yellow-500/40 bg-amber-50 dark:bg-yellow-500/15 text-yellow-500 dark:text-yellow-400 font-medium",
        low:
          "border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 text-black dark:text-white",
        info:
          "border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950/60 text-black dark:text-white",
        vulnerable:
          "border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/15 text-black dark:text-white font-bold",
        partial:
          "border border-amber-300 dark:border-yellow-500/40 bg-amber-50 dark:bg-yellow-500/15 text-yellow-500 dark:text-yellow-400 font-semibold",
        safe:
          "border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-black dark:text-white font-semibold",
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
