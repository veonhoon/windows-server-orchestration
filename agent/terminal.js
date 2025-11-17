const pty = require('node-pty');
const WebSocket = require('ws');

class TerminalManager {
  constructor() {
    this.terminals = new Map();
    this.terminalCounter = 0;
  }

  /**
   * Create a new PTY terminal session
   * @param {string} cwd - Working directory for the terminal
   * @returns {Object} Terminal session info
   */
  createTerminal(cwd = process.cwd()) {
    const terminalId = `term-${++this.terminalCounter}-${Date.now()}`;

    // Create PTY process for Windows
    const shell = process.env.SHELL || 'cmd.exe';
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: cwd,
      env: process.env,
      useConpty: true, // Use Windows ConPTY for better compatibility
    });

    const terminal = {
      id: terminalId,
      ptyProcess,
      clients: new Set(),
      createdAt: new Date(),
      cwd
    };

    // Handle PTY data output
    ptyProcess.onData((data) => {
      // Send data to all connected WebSocket clients
      terminal.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'output',
            data: data
          }));
        }
      });
    });

    // Handle PTY exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`Terminal ${terminalId} exited with code ${exitCode}`);
      terminal.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'exit',
            exitCode,
            signal
          }));
        }
      });
      this.terminals.delete(terminalId);
    });

    this.terminals.set(terminalId, terminal);

    return {
      id: terminalId,
      cwd,
      createdAt: terminal.createdAt
    };
  }

  /**
   * Write data to a terminal
   * @param {string} terminalId - Terminal ID
   * @param {string} data - Data to write
   * @returns {boolean} Success status
   */
  writeToTerminal(terminalId, data) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    terminal.ptyProcess.write(data);
    return true;
  }

  /**
   * Resize a terminal
   * @param {string} terminalId - Terminal ID
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {boolean} Success status
   */
  resizeTerminal(terminalId, cols, rows) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    try {
      terminal.ptyProcess.resize(cols, rows);
      return true;
    } catch (error) {
      console.error('Error resizing terminal:', error);
      return false;
    }
  }

  /**
   * Add a WebSocket client to a terminal session
   * @param {string} terminalId - Terminal ID
   * @param {WebSocket} client - WebSocket client
   * @returns {boolean} Success status
   */
  addClient(terminalId, client) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    terminal.clients.add(client);

    // Handle client disconnection
    client.on('close', () => {
      terminal.clients.delete(client);

      // If no clients left, kill the terminal after 5 minutes
      if (terminal.clients.size === 0) {
        setTimeout(() => {
          if (terminal.clients.size === 0) {
            this.killTerminal(terminalId);
          }
        }, 5 * 60 * 1000);
      }
    });

    return true;
  }

  /**
   * Kill a terminal session
   * @param {string} terminalId - Terminal ID
   * @returns {boolean} Success status
   */
  killTerminal(terminalId) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return false;
    }

    try {
      terminal.ptyProcess.kill();
      terminal.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.terminals.delete(terminalId);
      return true;
    } catch (error) {
      console.error('Error killing terminal:', error);
      return false;
    }
  }

  /**
   * Get info about a terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Object|null} Terminal info or null
   */
  getTerminalInfo(terminalId) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return null;
    }

    return {
      id: terminalId,
      cwd: terminal.cwd,
      createdAt: terminal.createdAt,
      clientCount: terminal.clients.size,
      pid: terminal.ptyProcess.pid
    };
  }

  /**
   * Get all terminal sessions
   * @returns {Array} List of terminal info objects
   */
  getAllTerminals() {
    const terminals = [];
    this.terminals.forEach((terminal, id) => {
      terminals.push(this.getTerminalInfo(id));
    });
    return terminals;
  }

  /**
   * Kill all terminals
   */
  killAllTerminals() {
    this.terminals.forEach((terminal, id) => {
      this.killTerminal(id);
    });
  }
}

module.exports = TerminalManager;
