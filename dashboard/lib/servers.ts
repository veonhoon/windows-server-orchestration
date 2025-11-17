export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  color?: string;
}

/**
 * Server configuration
 * Add your servers here with their Cloudflare Tunnel URLs or direct IPs
 */
export const servers: ServerConfig[] = [
  {
    id: 'server-1',
    name: 'Server 1 (US-East)',
    url: 'https://server1-agent.yourdomain.com',
    apiKey: 'super-secret-key-12345-server-1',
    color: '#3b82f6' // blue
  },
  {
    id: 'server-2',
    name: 'Server 2 (US-West)',
    url: 'https://server2-agent.yourdomain.com',
    apiKey: 'super-secret-key-67890-server-2',
    color: '#10b981' // green
  },
  {
    id: 'server-3',
    name: 'Server 3 (EU)',
    url: 'https://server3-agent.yourdomain.com',
    apiKey: 'super-secret-key-abcde-server-3',
    color: '#f59e0b' // amber
  },
  {
    id: 'server-4',
    name: 'Server 4 (Asia)',
    url: 'https://server4-agent.yourdomain.com',
    apiKey: 'super-secret-key-fghij-server-4',
    color: '#ef4444' // red
  }
];

/**
 * Get server by ID
 */
export function getServerById(id: string): ServerConfig | undefined {
  return servers.find(s => s.id === id);
}

/**
 * Get WebSocket URL for a server
 */
export function getWebSocketUrl(server: ServerConfig): string {
  const wsUrl = server.url.replace('https://', 'wss://').replace('http://', 'ws://');
  return `${wsUrl}/ws?apiKey=${encodeURIComponent(server.apiKey)}`;
}
