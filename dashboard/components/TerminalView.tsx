import { useEffect, useRef, useState } from 'react';
import { ServerConfig, getWebSocketUrl } from '@/lib/servers';

interface TerminalViewProps {
  server: ServerConfig;
}

export default function TerminalView({ server }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalId, setTerminalId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initTerminal = async () => {
      try {
        // Dynamic imports for xterm (client-side only)
        const { Terminal } = await import('xterm');
        const { FitAddon } = await import('xterm-addon-fit');
        const { WebLinksAddon } = await import('xterm-addon-web-links');

        if (!mounted || !terminalRef.current) return;

        // Create terminal instance
        const terminal = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: 'Consolas, "Courier New", monospace',
          theme: {
            background: '#0f172a',
            foreground: '#f1f5f9',
            cursor: '#3b82f6',
            cursorAccent: '#0f172a',
            selection: 'rgba(59, 130, 246, 0.3)',
            black: '#1e293b',
            red: '#ef4444',
            green: '#10b981',
            yellow: '#f59e0b',
            blue: '#3b82f6',
            magenta: '#a855f7',
            cyan: '#06b6d4',
            white: '#f1f5f9',
            brightBlack: '#475569',
            brightRed: '#f87171',
            brightGreen: '#34d399',
            brightYellow: '#fbbf24',
            brightBlue: '#60a5fa',
            brightMagenta: '#c084fc',
            brightCyan: '#22d3ee',
            brightWhite: '#ffffff'
          },
          scrollback: 10000,
          allowProposedApi: true
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        terminal.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Connect to WebSocket
        connectWebSocket(terminal);

        // Handle window resize
        const handleResize = () => {
          fitAddon.fit();
          if (wsRef.current?.readyState === WebSocket.OPEN && terminalId) {
            wsRef.current.send(JSON.stringify({
              type: 'terminal.resize',
              cols: terminal.cols,
              rows: terminal.rows
            }));
          }
        };

        window.addEventListener('resize', handleResize);

        // Clean up
        return () => {
          mounted = false;
          window.removeEventListener('resize', handleResize);
          terminal.dispose();
          if (wsRef.current) {
            wsRef.current.close();
          }
        };
      } catch (err) {
        console.error('Error initializing terminal:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize terminal');
        setIsLoading(false);
      }
    };

    const connectWebSocket = (terminal: any) => {
      try {
        const wsUrl = getWebSocketUrl(server);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Terminal WebSocket connected');
          setError(null);

          // Create terminal session
          ws.send(JSON.stringify({
            type: 'terminal.create',
            cwd: undefined // Will use config default
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'terminal.created':
                console.log('Terminal created:', data.terminal.id);
                setTerminalId(data.terminal.id);
                setIsLoading(false);

                // Send initial size
                ws.send(JSON.stringify({
                  type: 'terminal.resize',
                  cols: terminal.cols,
                  rows: terminal.rows
                }));
                break;

              case 'output':
                terminal.write(data.data);
                break;

              case 'exit':
                terminal.write('\r\n\r\n[Process exited with code ' + data.exitCode + ']\r\n');
                setError('Terminal session ended');
                break;

              case 'error':
                console.error('Terminal error:', data.message);
                terminal.write('\r\n\r\n[Error: ' + data.message + ']\r\n');
                setError(data.message);
                break;
            }
          } catch (err) {
            console.error('Error parsing terminal message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('Terminal WebSocket error:', event);
          setError('Connection error');
          setIsLoading(false);
        };

        ws.onclose = () => {
          console.log('Terminal WebSocket closed');
          terminal.write('\r\n\r\n[Disconnected from server]\r\n');
          setError('Disconnected');

          // Attempt reconnect after 5 seconds
          setTimeout(() => {
            if (mounted && terminalRef.current) {
              terminal.write('[Attempting to reconnect...]\r\n');
              connectWebSocket(terminal);
            }
          }, 5000);
        };

        // Handle terminal input
        terminal.onData((data: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'terminal.input',
              data: data
            }));
          }
        });
      } catch (err) {
        console.error('Error connecting WebSocket:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        setIsLoading(false);
      }
    };

    initTerminal();
  }, [server]);

  return (
    <div className="terminal-view">
      <div className="terminal-header">
        <span className="terminal-title">Terminal - {server.name}</span>
        {isLoading && <span className="terminal-status">Connecting...</span>}
        {error && <span className="terminal-status error">{error}</span>}
        {!isLoading && !error && <span className="terminal-status connected">Connected</span>}
      </div>
      <div className="terminal-container" ref={terminalRef}></div>

      <style jsx>{`
        .terminal-view {
          background: #1e293b;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .terminal-header {
          background: #0f172a;
          border-bottom: 1px solid #334155;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .terminal-title {
          color: #f1f5f9;
          font-weight: 600;
          font-size: 14px;
        }

        .terminal-status {
          color: #94a3b8;
          font-size: 12px;
        }

        .terminal-status.connected {
          color: #10b981;
        }

        .terminal-status.error {
          color: #ef4444;
        }

        .terminal-container {
          flex: 1;
          padding: 8px;
          overflow: hidden;
        }

        .terminal-container :global(.xterm) {
          height: 100%;
          padding: 8px;
        }

        .terminal-container :global(.xterm-viewport) {
          overflow-y: auto;
        }
      `}</style>

      {/* Global xterm CSS */}
      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css');
      `}</style>
    </div>
  );
}
