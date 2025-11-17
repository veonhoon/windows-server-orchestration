import { useEffect, useState } from 'react';
import { ServerConfig, getWebSocketUrl } from '@/lib/servers';

interface SystemStats {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    size: number;
    used: number;
    available: number;
    usagePercent: number;
    mount: string;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
  };
  timestamp: string;
}

interface StatsPanelProps {
  server: ServerConfig;
}

export default function StatsPanel({ server }: StatsPanelProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      try {
        const wsUrl = getWebSocketUrl(server);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Stats WebSocket connected');
          setConnected(true);
          setError(null);

          // Request stats updates
          ws?.send(JSON.stringify({
            type: 'stats.start',
            interval: 2000
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'stats') {
              setStats(data.data);
              setError(null);
            } else if (data.type === 'error') {
              setError(data.message);
            }
          } catch (err) {
            console.error('Error parsing stats:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('Stats WebSocket error:', event);
          setError('Connection error');
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('Stats WebSocket closed');
          setConnected(false);

          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error('Error connecting stats WebSocket:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.send(JSON.stringify({ type: 'stats.stop' }));
        ws.close();
      }
    };
  }, [server]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (error) {
    return (
      <div className="stats-panel">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <div className="error-hint">Reconnecting...</div>
        </div>
        <style jsx>{`
          .stats-panel {
            background: #1e293b;
            border-radius: 8px;
            padding: 16px;
            height: 100%;
          }
          .error {
            text-align: center;
            padding: 40px 20px;
            color: #f87171;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .error-message {
            font-size: 14px;
            margin-bottom: 8px;
          }
          .error-hint {
            font-size: 12px;
            color: #94a3b8;
          }
        `}</style>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-panel">
        <div className="loading">
          <div className="loading-spinner"></div>
          <div>Loading stats...</div>
        </div>
        <style jsx>{`
          .stats-panel {
            background: #1e293b;
            border-radius: 8px;
            padding: 16px;
            height: 100%;
          }
          .loading {
            text-align: center;
            padding: 40px 20px;
            color: #94a3b8;
          }
          .loading-spinner {
            border: 3px solid #334155;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h3>System Stats</h3>
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● Live' : '○ Disconnected'}
        </div>
      </div>

      <div className="stats-grid">
        {/* CPU */}
        <div className="stat-card">
          <div className="stat-label">CPU</div>
          <div className="stat-value">{stats.cpu.usage.toFixed(1)}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${stats.cpu.usage}%`, backgroundColor: '#3b82f6' }}></div>
          </div>
          <div className="stat-info">
            {stats.cpu.brand}<br />
            {stats.cpu.cores} cores @ {stats.cpu.speed} GHz
          </div>
        </div>

        {/* Memory */}
        <div className="stat-card">
          <div className="stat-label">Memory</div>
          <div className="stat-value">{stats.memory.usagePercent.toFixed(1)}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${stats.memory.usagePercent}%`, backgroundColor: '#10b981' }}></div>
          </div>
          <div className="stat-info">
            {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
          </div>
        </div>

        {/* Disk */}
        <div className="stat-card">
          <div className="stat-label">Disk ({stats.disk.mount})</div>
          <div className="stat-value">{stats.disk.usagePercent.toFixed(1)}%</div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: `${stats.disk.usagePercent}%`, backgroundColor: '#f59e0b' }}></div>
          </div>
          <div className="stat-info">
            {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.size)}
          </div>
        </div>

        {/* OS Info */}
        <div className="stat-card">
          <div className="stat-label">System</div>
          <div className="stat-info-large">
            <div><strong>{stats.os.hostname}</strong></div>
            <div>{stats.os.distro}</div>
            <div>{stats.os.platform} {stats.os.arch}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-panel {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          height: 100%;
          overflow-y: auto;
        }

        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0;
          font-size: 18px;
          color: #f1f5f9;
        }

        .status-indicator {
          font-size: 12px;
          font-weight: 600;
        }

        .status-indicator.connected {
          color: #10b981;
        }

        .status-indicator.disconnected {
          color: #ef4444;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 16px;
        }

        .stat-label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .stat-bar {
          height: 8px;
          background: #1e293b;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .stat-bar-fill {
          height: 100%;
          transition: width 0.5s ease;
          border-radius: 4px;
        }

        .stat-info {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .stat-info-large {
          font-size: 14px;
          color: #cbd5e1;
          line-height: 1.8;
        }

        .stat-info-large strong {
          color: #f1f5f9;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
