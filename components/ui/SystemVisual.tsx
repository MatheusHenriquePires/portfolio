"use client";

import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRef } from "react";
import type { PointerEvent } from "react";

import { systems, type VisualVariant } from "@/data/visuals";
import { SystemModule3D } from "@/components/visual/SystemModule3D";
import { DataFlowLine } from "@/components/visual/DataFlowLine";
import { TerminalPanel } from "@/components/visual/TerminalPanel";


const positions = [{ x: 50, y: 16 }, { x: 22, y: 43 }, { x: 78, y: 43 }, { x: 50, y: 69 }];
const paths = ["M300 100 V158 H132 V215", "M300 100 V158 H468 V215", "M132 215 V285 H300 V345", "M468 215 V285 H300 V345", "M300 345 V448"];

export function SystemVisual({ variant = "architecture", className = "", interactive = false, compact = false }: {
  variant?: VisualVariant; className?: string; interactive?: boolean; compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "60px" });
  const reduced = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawY, { stiffness: 40, damping: 22 });
  const rotateY = useSpring(rawX, { stiffness: 40, damping: 22 });
  const system = systems[variant];
  const connections = variant === "contact"
    ? ["M108 95 V155 H300 V225", "M492 95 V155 H300 V225", "M300 225 V390"]
    : variant === "about"
      ? ["M156 70 V180 H300 V255", "M444 70 V180 H300 V255", "M300 255 V350 H156 V425", "M300 255 V350 H444 V425"]
      : paths;

  function pointer(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - rect.left) / rect.width - .5) * 9);
    rawY.set(-((event.clientY - rect.top) / rect.height - .5) * 7);
  }

  return <div ref={ref} className={`system-scene system-scene--${variant} ${compact ? "system-scene--compact" : ""} ${className}`} aria-hidden="true" data-moving={visible && !reduced}
    onPointerMove={pointer} onPointerLeave={() => { rawX.set(0); rawY.set(0); }}>
    <div className="system-ambient" />
    <motion.div className="system-parallax" style={{ rotateX, rotateY }}>
      <div className="system-plane">
        <div className="system-grid" />
        {variant === "architecture" && <div className="architecture-brackets"><span>{"{"}</span><span>{"}"}</span></div>}
        <svg className="system-connections" viewBox="0 0 600 500" fill="none" preserveAspectRatio="none">
          {connections.map((path, i) => <DataFlowLine key={path} path={path} delay={i * -1.3} />)}
          {variant !== "about" && variant !== "contact" && <><circle cx="300" cy="158" r="4" className="system-junction" /><circle cx="300" cy="285" r="4" className="system-junction" /></>}
        </svg>
        {system.nodes.map((node, i) => <SystemModule3D key={node.title} {...node} index={i} x={positions[i].x} y={positions[i].y} />)}
        <TerminalPanel command={system.command} output={system.output} />
      </div>
    </motion.div>
    <span className="system-caption label">{system.label}</span>
  </div>;
}
