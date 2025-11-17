import { useEffect, useState } from 'react';
import { ServerConfig, getWebSocketUrl } from '@/lib/servers';

interface Phone {
  serial: string;
  name: string;
  description: string;
  currentStatus: 'online' | 'offline' | 'unauthorized';
  model: string;
  androidVersion: string;
  batteryLevel: number | null;
  lastSeen: string | null;
  addedAt: string;
}

interface PhoneStatus {
  isMonitoring: boolean;
  totalDevices: number;
  online: number;
  offline: number;
  unauthorized: number;
  devices: Phone[];
  lastUpdate: string;
}

interface PhoneMonitorProps {
  server: ServerConfig;
}

export default function PhoneMonitor({ server }: PhoneMonitorProps) {
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus | null>(null);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState({ serial: '', name: '', description: '' });
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      try {
        const wsUrl = getWebSocketUrl(server);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Phone monitor WebSocket connected');
          setConnected(true);
          setError(null);

          // Request phone status updates
          ws?.send(JSON.stringify({
            type: 'phones.start'
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'phones.status') {
              setPhoneStatus(data.data);
              setError(null);
            } else if (data.type === 'error') {
              setError(data.message);
            }
          } catch (err) {
            console.error('Error parsing phone status:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('Phone monitor WebSocket error:', event);
          setError('Connection error');
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('Phone monitor WebSocket closed');
          setConnected(false);

          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error('Error connecting phone monitor WebSocket:', err);
        setError(err instanceof Error ? err.message : 'Connection failed');
        setTimeout(connect, 5000);
      }
    };

    connect();

    // Also fetch phone list via REST
    fetchPhones();

    return () => {
      if (ws) {
        ws.send(JSON.stringify({ type: 'phones.stop' }));
        ws.close();
      }
    };
  }, [server]);

  const fetchPhones = async () => {
    try {
      const response = await fetch(`${server.url}/phones`, {
        headers: {
          'X-API-Key': server.apiKey
        }
      });
      const data = await response.json();
      if (data.success) {
        setPhones(data.phones);
      }
    } catch (err) {
      console.error('Error fetching phones:', err);
    }
  };

  const handleAddPhone = async () => {
    if (!newPhone.serial.trim()) {
      alert('Serial number is required');
      return;
    }

    try {
      const response = await fetch(`${server.url}/phones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': server.apiKey
        },
        body: JSON.stringify(newPhone)
      });

      const data = await response.json();
      if (data.success) {
        setNewPhone({ serial: '', name: '', description: '' });
        setShowAddModal(false);
        fetchPhones();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error adding phone: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdatePhone = async (serial: string, updates: { name?: string; description?: string }) => {
    try {
      const response = await fetch(`${server.url}/phones/${serial}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': server.apiKey
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (data.success) {
        setEditingPhone(null);
        fetchPhones();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error updating phone: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeletePhone = async (serial: string) => {
    if (!confirm(`Are you sure you want to remove phone ${serial}?`)) {
      return;
    }

    try {
      const response = await fetch(`${server.url}/phones/${serial}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': server.apiKey
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchPhones();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error deleting phone: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRebootPhone = async (serial: string) => {
    if (!confirm(`Are you sure you want to reboot ${serial}?`)) {
      return;
    }

    try {
      const response = await fetch(`${server.url}/phones/${serial}/reboot`, {
        method: 'POST',
        headers: {
          'X-API-Key': server.apiKey
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error rebooting phone: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'offline':
        return '#6b7280';
      case 'unauthorized':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '●';
      case 'offline':
        return '○';
      case 'unauthorized':
        return '⚠';
      default:
        return '○';
    }
  };

  if (error) {
    return (
      <div className="phone-monitor">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <div className="error-hint">Reconnecting...</div>
        </div>
        <style jsx>{`
          .phone-monitor {
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

  return (
    <div className="phone-monitor">
      <div className="phone-header">
        <div className="header-left">
          <h3>Phone Monitor</h3>
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Live' : '○ Disconnected'}
          </div>
        </div>
        <button className="add-phone-btn" onClick={() => setShowAddModal(true)}>
          ➕ Add Phone
        </button>
      </div>

      {phoneStatus && (
        <div className="status-summary">
          <div className="summary-item">
            <div className="summary-label">Total</div>
            <div className="summary-value">{phoneStatus.totalDevices}</div>
          </div>
          <div className="summary-item online">
            <div className="summary-label">Online</div>
            <div className="summary-value">{phoneStatus.online}</div>
          </div>
          <div className="summary-item offline">
            <div className="summary-label">Offline</div>
            <div className="summary-value">{phoneStatus.offline}</div>
          </div>
          <div className="summary-item unauthorized">
            <div className="summary-label">Unauthorized</div>
            <div className="summary-value">{phoneStatus.unauthorized}</div>
          </div>
        </div>
      )}

      <div className="phones-list">
        {phoneStatus && phoneStatus.devices.length === 0 ? (
          <div className="empty-state">
            No phones configured. Click "Add Phone" to get started.
          </div>
        ) : (
          phoneStatus?.devices.map((phone) => (
            <div key={phone.serial} className="phone-card">
              <div className="phone-card-header">
                <div className="phone-status">
                  <span
                    className="status-icon"
                    style={{ color: getStatusColor(phone.currentStatus) }}
                  >
                    {getStatusIcon(phone.currentStatus)}
                  </span>
                  <span className="status-text">{phone.currentStatus}</span>
                </div>
                <div className="phone-actions">
                  <button
                    className="action-btn-small"
                    onClick={() => setEditingPhone(phone)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn-small"
                    onClick={() => handleRebootPhone(phone.serial)}
                    disabled={phone.currentStatus !== 'online'}
                    title="Reboot"
                  >
                    🔄
                  </button>
                  <button
                    className="action-btn-small danger"
                    onClick={() => handleDeletePhone(phone.serial)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="phone-name">{phone.name}</div>
              <div className="phone-serial">{phone.serial}</div>
              {phone.description && (
                <div className="phone-description">{phone.description}</div>
              )}

              <div className="phone-details">
                <div className="detail-item">
                  <span className="detail-label">Model:</span>
                  <span className="detail-value">{phone.model}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Android:</span>
                  <span className="detail-value">{phone.androidVersion}</span>
                </div>
                {phone.batteryLevel !== null && (
                  <div className="detail-item">
                    <span className="detail-label">Battery:</span>
                    <span className="detail-value">{phone.batteryLevel}%</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Phone Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Phone</h3>
            <div className="form-group">
              <label>Serial Number *</label>
              <input
                type="text"
                value={newPhone.serial}
                onChange={(e) => setNewPhone({ ...newPhone, serial: e.target.value })}
                placeholder="e.g., 1234567890ABCDEF"
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newPhone.name}
                onChange={(e) => setNewPhone({ ...newPhone, name: e.target.value })}
                placeholder="e.g., Phone 1"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={newPhone.description}
                onChange={(e) => setNewPhone({ ...newPhone, description: e.target.value })}
                placeholder="e.g., Test device"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddPhone}>
                Add Phone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Phone Modal */}
      {editingPhone && (
        <div className="modal-overlay" onClick={() => setEditingPhone(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Phone</h3>
            <div className="form-group">
              <label>Serial Number</label>
              <input type="text" value={editingPhone.serial} disabled />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingPhone.name}
                onChange={(e) => setEditingPhone({ ...editingPhone, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={editingPhone.description}
                onChange={(e) => setEditingPhone({ ...editingPhone, description: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingPhone(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  handleUpdatePhone(editingPhone.serial, {
                    name: editingPhone.name,
                    description: editingPhone.description
                  })
                }
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .phone-monitor {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .phone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .add-phone-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .add-phone-btn:hover {
          background: #2563eb;
        }

        .status-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .summary-item {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .summary-item.online {
          border-left: 4px solid #10b981;
        }

        .summary-item.offline {
          border-left: 4px solid #6b7280;
        }

        .summary-item.unauthorized {
          border-left: 4px solid #f59e0b;
        }

        .summary-label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .phones-list {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          align-content: start;
        }

        .phone-card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 12px;
        }

        .phone-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .phone-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-icon {
          font-size: 16px;
        }

        .status-text {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
        }

        .phone-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn-small {
          background: transparent;
          border: 1px solid #334155;
          color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .action-btn-small:hover {
          background: #1e293b;
          border-color: #475569;
        }

        .action-btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn-small.danger:hover {
          background: #ef4444;
          border-color: #ef4444;
        }

        .phone-name {
          font-size: 16px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 4px;
        }

        .phone-serial {
          font-size: 12px;
          color: #64748b;
          font-family: 'Consolas', monospace;
          margin-bottom: 8px;
        }

        .phone-description {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .phone-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #334155;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .detail-label {
          color: #94a3b8;
        }

        .detail-value {
          color: #f1f5f9;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
        }

        .modal h3 {
          margin: 0 0 16px 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 14px;
        }

        .form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #475569;
          color: white;
        }

        .btn-secondary:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
