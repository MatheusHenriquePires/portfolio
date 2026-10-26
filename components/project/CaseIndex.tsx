"use client";

import { useEffect, useState } from "react";

export function CaseIndex({ items }: { items: { id: string; label: string }[] }) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const elements = items.map(item => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setCurrent(visible.target.id);
    }, { rootMargin: "-20% 0px -60% 0px" });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return <nav className="case-index" aria-label="Neste case">
    <span className="label">Neste case</span>
    <ol>{items.map((item, index) => <li key={item.id}><a href={`#${item.id}`} aria-current={current === item.id ? "location" : undefined}><span className="label">{String(index + 1).padStart(2, "0")}</span>{item.label}</a></li>)}</ol>
  </nav>;
}
