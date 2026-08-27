import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-100 text-zinc-950 hover:bg-white active:scale-[0.98] shadow-sm font-semibold",
        destructive:
          "bg-zinc-900 border border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500",
        outline:
          "border border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 hover:text-white",
        secondary:
          "bg-zinc-900 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-800 hover:text-white",
        ghost:
          "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
        link:
          "text-zinc-300 underline-offset-4 hover:underline",
        subtle:
          "bg-zinc-900/60 text-zinc-400 border border-zinc-800/40 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
