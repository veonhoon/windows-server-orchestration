import { ServerConfig } from './servers';

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Make an authenticated request to a server agent
 */
export async function fetchFromServer(
  server: ServerConfig,
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const { method = 'GET', body, headers = {} } = options;

  const url = `${server.url}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'X-API-Key': server.apiKey,
    ...headers
  };

  if (body) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${server.name}:`, error);
    throw error;
  }
}

/**
 * Get system stats from a server
 */
export async function getServerStats(server: ServerConfig) {
  return fetchFromServer(server, '/stats');
}

/**
 * Run a command on a server
 */
export async function runCommand(server: ServerConfig, command: string, cwd?: string) {
  return fetchFromServer(server, '/run', {
    method: 'POST',
    body: { command, cwd }
  });
}

/**
 * Restart the main program on a server
 */
export async function restartProgram(server: ServerConfig, programName?: string) {
  return fetchFromServer(server, '/restartProgram', {
    method: 'POST',
    body: { programName }
  });
}

/**
 * Start the main program on a server
 */
export async function startProgram(server: ServerConfig) {
  return fetchFromServer(server, '/startProgram', {
    method: 'POST'
  });
}

/**
 * Stop the main program on a server
 */
export async function stopProgram(server: ServerConfig) {
  return fetchFromServer(server, '/stopProgram', {
    method: 'POST'
  });
}

/**
 * Restart the agent on a server
 */
export async function restartAgent(server: ServerConfig) {
  return fetchFromServer(server, '/restartAgent', {
    method: 'POST'
  });
}

/**
 * Get PM2 logs from a server
 */
export async function getLogs(server: ServerConfig, processName?: string, lines: number = 100) {
  const query = new URLSearchParams();
  if (processName) query.set('process', processName);
  query.set('lines', lines.toString());

  return fetchFromServer(server, `/logs?${query.toString()}`);
}

/**
 * Get PM2 process list from a server
 */
export async function getPM2List(server: ServerConfig) {
  return fetchFromServer(server, '/pm2/list');
}

/**
 * Execute git pull on a server
 */
export async function gitPull(server: ServerConfig, directory?: string) {
  return fetchFromServer(server, '/git/pull', {
    method: 'POST',
    body: { directory }
  });
}

/**
 * Get git status from a server
 */
export async function gitStatus(server: ServerConfig, directory?: string) {
  const query = directory ? `?directory=${encodeURIComponent(directory)}` : '';
  return fetchFromServer(server, `/git/status${query}`);
}

/**
 * Get server configuration
 */
export async function getServerConfig(server: ServerConfig) {
  return fetchFromServer(server, '/config');
}

/**
 * Update server configuration
 */
export async function updateServerConfig(server: ServerConfig, config: any) {
  return fetchFromServer(server, '/config', {
    method: 'POST',
    body: config
  });
}

/**
 * Create a terminal session on a server
 */
export async function createTerminal(server: ServerConfig, cwd?: string) {
  return fetchFromServer(server, '/terminal/create', {
    method: 'POST',
    body: { cwd }
  });
}

/**
 * Get list of terminal sessions on a server
 */
export async function getTerminalList(server: ServerConfig) {
  return fetchFromServer(server, '/terminal/list');
}

/**
 * Kill a terminal session on a server
 */
export async function killTerminal(server: ServerConfig, terminalId: string) {
  return fetchFromServer(server, `/terminal/${terminalId}`, {
    method: 'DELETE'
  });
}
