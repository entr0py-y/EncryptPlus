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
        secondary:
          "border border-zinc-800/60 bg-zinc-950 text-zinc-400",
        outline:
          "border border-zinc-700 text-zinc-300",
        solid:
          "bg-zinc-100 text-zinc-950 font-semibold border border-white",
        muted:
          "border border-zinc-900 bg-zinc-900/40 text-zinc-500",
        critical:
          "border border-zinc-200 bg-white text-zinc-950 font-bold",
        high:
          "border border-zinc-400 bg-zinc-200 text-zinc-900 font-semibold",
        medium:
          "border border-zinc-700 bg-zinc-800 text-zinc-200",
        low:
          "border border-zinc-800 bg-zinc-900 text-zinc-400",
        info:
          "border border-zinc-800/80 bg-zinc-950 text-zinc-500",
        vulnerable:
          "border border-zinc-300 bg-zinc-100 text-zinc-950 font-bold",
        partial:
          "border border-zinc-700 bg-zinc-800/80 text-zinc-300",
        safe:
          "border border-zinc-800 bg-zinc-950 text-zinc-300",
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
