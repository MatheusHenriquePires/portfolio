export function TerminalPanel({ command, output }: { command: string; output: string }) {
  return <div className="system-terminal"><div className="terminal-bar"><span /><span /><span /><small>_terminal</small></div><div className="terminal-command"><span className="terminal-prompt">›</span> {command}<span className="terminal-cursor" /></div><div className="terminal-output">{output}</div></div>;
}
