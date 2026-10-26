export function DataFlowLine({ path, delay = 0 }: { path: string; delay?: number }) {
  return <g><path className="system-path" d={path} /><path className="system-packet" d={path} style={{ animationDelay: `${delay}s` }} /></g>;
}
