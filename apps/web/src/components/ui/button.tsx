import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-[0.98] shadow-sm font-semibold",
        yellow:
          "bg-[linear-gradient(135deg,#eab308_0%,#fde047_50%,#fef08a_100%)] hover:opacity-95 text-zinc-950 font-semibold active:scale-[0.98] shadow-[0_0_25px_rgba(234,179,8,0.45),0_0_10px_rgba(250,204,21,0.55)] dark:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6),0_0_15px_rgba(250,204,21,0.7)] dark:hover:shadow-[0_0_25px_rgba(234,179,8,0.55)] border-0",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 dark:bg-zinc-900 dark:border dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
        outline:
          "border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-white",
        secondary:
          "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white",
        ghost:
          "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-100",
        link:
          "text-zinc-700 dark:text-zinc-300 underline-offset-4 hover:underline",
        subtle:
          "bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-200",
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
