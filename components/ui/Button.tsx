import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Link> & { variant?: "primary" | "secondary"; arrow?: boolean };

export function Button({ children, className = "", variant = "primary", arrow = false, ...props }: ButtonProps) {
  return <Link className={`button button--${variant} ${className}`} {...props}>{children}{arrow && <span aria-hidden="true">↗</span>}</Link>;
}
