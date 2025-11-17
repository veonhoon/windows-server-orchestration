import { ServerConfig } from '@/lib/servers';

interface ServerSelectorProps {
  servers: ServerConfig[];
  selectedServer: ServerConfig | null;
  onSelectServer: (server: ServerConfig) => void;
}

export default function ServerSelector({
  servers,
  selectedServer,
  onSelectServer
}: ServerSelectorProps) {
  return (
    <div className="server-selector">
      <h2>Servers</h2>
      <div className="server-list">
        {servers.map((server) => (
          <button
            key={server.id}
            className={`server-button ${selectedServer?.id === server.id ? 'active' : ''}`}
            onClick={() => onSelectServer(server)}
            style={{
              borderLeftColor: server.color || '#3b82f6'
            }}
          >
            <div className="server-name">{server.name}</div>
            <div className="server-id">{server.id}</div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .server-selector {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          height: 100%;
        }

        h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #f1f5f9;
        }

        .server-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .server-button {
          background: #0f172a;
          border: 1px solid #334155;
          border-left: 4px solid #3b82f6;
          border-radius: 6px;
          padding: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          color: #f1f5f9;
        }

        .server-button:hover {
          background: #1e293b;
          border-color: #475569;
          transform: translateX(2px);
        }

        .server-button.active {
          background: #1e40af;
          border-color: #3b82f6;
        }

        .server-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .server-id {
          font-size: 12px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
