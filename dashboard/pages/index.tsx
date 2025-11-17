import { useState, useEffect } from 'react';
import Head from 'next/head';
import ServerSelector from '@/components/ServerSelector';
import StatsPanel from '@/components/StatsPanel';
import TerminalView from '@/components/TerminalView';
import { servers, ServerConfig } from '@/lib/servers';
import {
  runCommand,
  restartProgram,
  startProgram,
  stopProgram,
  restartAgent,
  getLogs,
  getPM2List,
  gitPull,
  gitStatus,
  getServerConfig,
  updateServerConfig
} from '@/lib/fetcher';

interface PM2Process {
  name: string;
  pm_id: number;
  status: string;
  cpu: number;
  memory: number;
}

export default function Home() {
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'terminal' | 'logs' | 'config'>('control');
  const [commandInput, setCommandInput] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState('');
  const [pm2Processes, setPm2Processes] = useState<PM2Process[]>([]);
  const [configData, setConfigData] = useState<any>(null);
  const [configEditing, setConfigEditing] = useState(false);

  // Select first server by default
  useEffect(() => {
    if (!selectedServer && servers.length > 0) {
      setSelectedServer(servers[0]);
    }
  }, [selectedServer]);

  // Load PM2 processes when control tab is active
  useEffect(() => {
    if (selectedServer && activeTab === 'control') {
      loadPM2Processes();
      const interval = setInterval(loadPM2Processes, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedServer, activeTab]);

  // Load config when config tab is active
  useEffect(() => {
    if (selectedServer && activeTab === 'config') {
      loadConfig();
    }
  }, [selectedServer, activeTab]);

  const loadPM2Processes = async () => {
    if (!selectedServer) return;

    try {
      const result = await getPM2List(selectedServer);
      if (result.success && result.processes) {
        setPm2Processes(result.processes);
      }
    } catch (error) {
      console.error('Error loading PM2 processes:', error);
    }
  };

  const loadConfig = async () => {
    if (!selectedServer) return;

    try {
      const result = await getServerConfig(selectedServer);
      if (result.success) {
        setConfigData(result.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleRunCommand = async () => {
    if (!selectedServer || !commandInput.trim()) return;

    setLoading(true);
    try {
      const result = await runCommand(selectedServer, commandInput);
      setCommandOutput(
        `$ ${commandInput}\n\n` +
        `STDOUT:\n${result.stdout || '(empty)'}\n\n` +
        `STDERR:\n${result.stderr || '(empty)'}\n\n` +
        `Exit Code: ${result.exitCode}\n` +
        `Success: ${result.success ? 'Yes' : 'No'}\n` +
        `---\n\n` +
        commandOutput
      );
    } catch (error) {
      setCommandOutput(
        `$ ${commandInput}\n\nERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n---\n\n` +
        commandOutput
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestartProgram = async () => {
    if (!selectedServer) return;

    setLoading(true);
    try {
      const result = await restartProgram(selectedServer);
      alert(result.success ? result.message : `Error: ${result.error}`);
      await loadPM2Processes();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProgram = async () => {
    if (!selectedServer) return;

    setLoading(true);
    try {
      const result = await startProgram(selectedServer);
      alert(result.success ? result.message : `Error: ${result.error}`);
      await loadPM2Processes();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopProgram = async () => {
    if (!selectedServer) return;

    if (!confirm('Are you sure you want to stop the main program?')) return;

    setLoading(true);
    try {
      const result = await stopProgram(selectedServer);
      alert(result.success ? result.message : `Error: ${result.error}`);
      await loadPM2Processes();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestartAgent = async () => {
    if (!selectedServer) return;

    if (!confirm('Are you sure you want to restart the agent? It will be unavailable for a few seconds.')) return;

    setLoading(true);
    try {
      const result = await restartAgent(selectedServer);
      alert(result.success ? result.message : `Error: ${result.error}`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGitPull = async () => {
    if (!selectedServer) return;

    if (!confirm('Execute git pull on the server?')) return;

    setLoading(true);
    try {
      const result = await gitPull(selectedServer);
      alert(
        result.success
          ? `Git pull completed:\n\n${result.output}`
          : `Git pull failed:\n\n${result.error}`
      );
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLogs = async (processName?: string) => {
    if (!selectedServer) return;

    setLoading(true);
    try {
      const result = await getLogs(selectedServer, processName, 200);
      if (result.success) {
        setLogs(result.logs || 'No logs available');
      } else {
        setLogs(`Error: ${result.error}`);
      }
    } catch (error) {
      setLogs(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedServer || !configData) return;

    setLoading(true);
    try {
      const result = await updateServerConfig(selectedServer, configData);
      if (result.success) {
        alert('Configuration updated successfully');
        setConfigEditing(false);
        await loadConfig();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedServer) {
    return (
      <div className="container">
        <div className="loading-screen">
          <h1>Server Orchestration Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - {selectedServer.name}</title>
      </Head>

      <div className="container">
        <header className="header">
          <h1>🖥️ Server Orchestration Dashboard</h1>
          <div className="header-info">
            <span className="current-server">
              Current: <strong>{selectedServer.name}</strong>
            </span>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            <ServerSelector
              servers={servers}
              selectedServer={selectedServer}
              onSelectServer={setSelectedServer}
            />
          </aside>

          <main className="main-content">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'control' ? 'active' : ''}`}
                onClick={() => setActiveTab('control')}
              >
                Control Panel
              </button>
              <button
                className={`tab ${activeTab === 'terminal' ? 'active' : ''}`}
                onClick={() => setActiveTab('terminal')}
              >
                Terminal
              </button>
              <button
                className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                Logs
              </button>
              <button
                className={`tab ${activeTab === 'config' ? 'active' : ''}`}
                onClick={() => setActiveTab('config')}
              >
                Config
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'control' && (
                <div className="control-panel">
                  <section className="panel-section">
                    <h2>System Statistics</h2>
                    <div className="stats-container">
                      <StatsPanel server={selectedServer} />
                    </div>
                  </section>

                  <section className="panel-section">
                    <h2>PM2 Processes</h2>
                    <div className="pm2-list">
                      {pm2Processes.length === 0 ? (
                        <div className="empty-state">No PM2 processes found</div>
                      ) : (
                        <table className="pm2-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Status</th>
                              <th>CPU</th>
                              <th>Memory</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pm2Processes.map((proc) => (
                              <tr key={proc.pm_id}>
                                <td>{proc.pm_id}</td>
                                <td>{proc.name}</td>
                                <td>
                                  <span className={`status-badge ${proc.status}`}>
                                    {proc.status}
                                  </span>
                                </td>
                                <td>{proc.cpu}%</td>
                                <td>{(proc.memory / 1024 / 1024).toFixed(0)} MB</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>

                  <section className="panel-section">
                    <h2>Quick Actions</h2>
                    <div className="action-buttons">
                      <button
                        className="action-btn primary"
                        onClick={handleRestartProgram}
                        disabled={loading}
                      >
                        🔄 Restart Program
                      </button>
                      <button
                        className="action-btn success"
                        onClick={handleStartProgram}
                        disabled={loading}
                      >
                        ▶️ Start Program
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={handleStopProgram}
                        disabled={loading}
                      >
                        ⏹️ Stop Program
                      </button>
                      <button
                        className="action-btn warning"
                        onClick={handleRestartAgent}
                        disabled={loading}
                      >
                        🔃 Restart Agent
                      </button>
                      <button
                        className="action-btn secondary"
                        onClick={handleGitPull}
                        disabled={loading}
                      >
                        📥 Git Pull
                      </button>
                    </div>
                  </section>

                  <section className="panel-section">
                    <h2>Run Command</h2>
                    <div className="command-input-group">
                      <input
                        type="text"
                        className="command-input"
                        placeholder="Enter command (e.g., dir, pm2 list, node --version)"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleRunCommand()}
                        disabled={loading}
                      />
                      <button
                        className="action-btn primary"
                        onClick={handleRunCommand}
                        disabled={loading || !commandInput.trim()}
                      >
                        Run
                      </button>
                    </div>
                    {commandOutput && (
                      <div className="command-output">
                        <div className="output-header">
                          <span>Output</span>
                          <button
                            className="clear-btn"
                            onClick={() => setCommandOutput('')}
                          >
                            Clear
                          </button>
                        </div>
                        <pre>{commandOutput}</pre>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'terminal' && (
                <div className="terminal-container-full">
                  <TerminalView server={selectedServer} />
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="logs-panel">
                  <div className="logs-header">
                    <h2>Logs Viewer</h2>
                    <div className="logs-actions">
                      <button
                        className="action-btn secondary"
                        onClick={() => handleGetLogs()}
                        disabled={loading}
                      >
                        Refresh All Logs
                      </button>
                      <button
                        className="action-btn secondary"
                        onClick={() => handleGetLogs('agent-api')}
                        disabled={loading}
                      >
                        Agent Logs
                      </button>
                      {pm2Processes.length > 0 && (
                        <button
                          className="action-btn secondary"
                          onClick={() => handleGetLogs(pm2Processes[0].name)}
                          disabled={loading}
                        >
                          Program Logs
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="logs-content">
                    {logs ? (
                      <pre>{logs}</pre>
                    ) : (
                      <div className="empty-state">
                        Click a button above to load logs
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="config-panel">
                  <div className="config-header">
                    <h2>Server Configuration</h2>
                    <div className="config-actions">
                      {!configEditing ? (
                        <button
                          className="action-btn primary"
                          onClick={() => setConfigEditing(true)}
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            className="action-btn success"
                            onClick={handleSaveConfig}
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            className="action-btn secondary"
                            onClick={() => {
                              setConfigEditing(false);
                              loadConfig();
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {configData ? (
                    <div className="config-content">
                      {configEditing ? (
                        <textarea
                          className="config-editor"
                          value={JSON.stringify(configData, null, 2)}
                          onChange={(e) => {
                            try {
                              setConfigData(JSON.parse(e.target.value));
                            } catch (err) {
                              // Invalid JSON, don't update
                            }
                          }}
                        />
                      ) : (
                        <pre>{JSON.stringify(configData, null, 2)}</pre>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">Loading configuration...</div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 20px;
        }

        .loading-screen {
          text-align: center;
          padding: 100px 20px;
        }

        .header {
          background: #1e293b;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        h1 {
          margin: 0;
          font-size: 24px;
          color: #f1f5f9;
        }

        .header-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .current-server {
          color: #94a3b8;
          font-size: 14px;
        }

        .current-server strong {
          color: #f1f5f9;
        }

        .layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          height: calc(100vh - 120px);
        }

        .sidebar {
          overflow-y: auto;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tabs {
          background: #1e293b;
          border-radius: 8px 8px 0 0;
          padding: 8px;
          display: flex;
          gap: 4px;
        }

        .tab {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab:hover {
          background: #0f172a;
          color: #f1f5f9;
        }

        .tab.active {
          background: #3b82f6;
          color: white;
        }

        .tab-content {
          background: #1e293b;
          border-radius: 0 0 8px 8px;
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        }

        .control-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .panel-section {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .panel-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #f1f5f9;
        }

        .stats-container {
          min-height: 200px;
        }

        .pm2-list {
          overflow-x: auto;
        }

        .pm2-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pm2-table th {
          text-align: left;
          padding: 12px;
          background: #1e293b;
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pm2-table td {
          padding: 12px;
          border-top: 1px solid #334155;
          color: #f1f5f9;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.online {
          background: #10b98130;
          color: #10b981;
        }

        .status-badge.stopping,
        .status-badge.stopped {
          background: #ef444430;
          color: #ef4444;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .action-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .action-btn.success {
          background: #10b981;
          color: white;
        }

        .action-btn.success:hover:not(:disabled) {
          background: #059669;
        }

        .action-btn.danger {
          background: #ef4444;
          color: white;
        }

        .action-btn.danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .action-btn.warning {
          background: #f59e0b;
          color: white;
        }

        .action-btn.warning:hover:not(:disabled) {
          background: #d97706;
        }

        .action-btn.secondary {
          background: #475569;
          color: white;
        }

        .action-btn.secondary:hover:not(:disabled) {
          background: #334155;
        }

        .command-input-group {
          display: flex;
          gap: 12px;
        }

        .command-input {
          flex: 1;
          padding: 12px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 14px;
          font-family: 'Consolas', 'Courier New', monospace;
        }

        .command-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .command-output {
          margin-top: 16px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          overflow: hidden;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #0f172a;
          border-bottom: 1px solid #334155;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 12px;
        }

        .clear-btn:hover {
          text-decoration: underline;
        }

        .command-output pre {
          padding: 16px;
          margin: 0;
          color: #f1f5f9;
          font-size: 13px;
          font-family: 'Consolas', 'Courier New', monospace;
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 400px;
          overflow-y: auto;
        }

        .terminal-container-full {
          height: calc(100vh - 260px);
        }

        .logs-panel,
        .config-panel {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 260px);
        }

        .logs-header,
        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .logs-header h2,
        .config-header h2 {
          margin: 0;
        }

        .logs-actions,
        .config-actions {
          display: flex;
          gap: 8px;
        }

        .logs-content,
        .config-content {
          flex: 1;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 16px;
          overflow: auto;
        }

        .logs-content pre,
        .config-content pre {
          margin: 0;
          color: #f1f5f9;
          font-size: 13px;
          font-family: 'Consolas', 'Courier New', monospace;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .config-editor {
          width: 100%;
          height: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 16px;
          color: #f1f5f9;
          font-size: 13px;
          font-family: 'Consolas', 'Courier New', monospace;
          resize: none;
        }

        .config-editor:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        @media (max-width: 1024px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sidebar {
            max-height: 300px;
          }
        }
      `}</style>
    </>
  );
}
