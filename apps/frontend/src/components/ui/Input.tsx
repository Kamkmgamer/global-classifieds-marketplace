"use client";

import * as React from "react";
import clsx from "clsx";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  uiSize?: "sm" | "md" | "lg";
};

const sizes: Record<NonNullable<NonNullable<InputProps["uiSize"]>>, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

export function Input({ className, uiSize = "md", ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "w-full rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        sizes[uiSize],
        className
      )}
      {...props}
    />
  );
}

export default Input;
