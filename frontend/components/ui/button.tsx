import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { IconHover } from "@/components/icon-hover";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "glass-interactive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "primary-action bg-black text-white hover:bg-neutral-800 active:bg-neutral-900",
        secondary:
          "primary-action bg-black text-white hover:bg-neutral-800 active:bg-neutral-900",
        ghost: "text-muted hover:bg-surface-secondary hover:text-foreground",
        danger:
          "bg-danger-action text-white hover:bg-red-700 active:bg-red-800",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-sm",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, type = "button", ...props },
    ref,
  ) {
    return (
      <IconHover>
        <button
          ref={ref}
          className={cn(buttonStyles({ variant, size }), className)}
          type={type}
          {...props}
        />
      </IconHover>
    );
  },
);
