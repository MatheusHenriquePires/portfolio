"use client";

import { useEffect, useRef } from "react";
import { useAnimate, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { gentleTransition } from "@/lib/motion";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();
  const played = useRef(false);

  useEffect(() => {
    const node = scope.current as HTMLElement;
    if (!node || reducedMotion || played.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      played.current = true;
      void animate(node, { opacity: [0, 1], y: [18, 0] }, { ...gentleTransition, delay });
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [scope, animate, reducedMotion, delay]);

  return <div ref={scope} className={className}>{children}</div>;
}
