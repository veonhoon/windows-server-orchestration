const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const { getSystemStats, startStatsStream } = require('./stats');
const shell = require('./shell');
const TerminalManager = require('./terminal');
const ADBMonitor = require('./adb-monitor');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
let config = {
  startupCommand: 'npm run start',
  programCwd: 'C:\\MyPrograms\\server-program',
  programName: 'server-program',
  agentPort: 3001,
  apiKey: 'your-secret-api-key-change-this'
};

if (fs.existsSync(configPath)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  } catch (error) {
    console.error('Error loading config.json:', error.message);
  }
}

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Initialize terminal manager
const terminalManager = new TerminalManager();

// Initialize ADB monitor
const adbMonitor = new ADBMonitor(configPath);
adbMonitor.startMonitoring(5000); // Check every 5 seconds

// Middleware
app.use(cors());
app.use(express.json());

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    });
  }

  next();
};

// Apply authentication to all routes
app.use(authenticateApiKey);

// Routes

/**
 * GET / - Health check
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agent API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /stats - Get system statistics
 */
app.get('/stats', async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /run - Execute a shell command
 */
app.post('/run', async (req, res) => {
  const { command, cwd } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'Command is required'
    });
  }

  try {
    const result = await shell.executeCommand(command, { cwd: cwd || process.cwd() });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /restartProgram - Restart the main program via PM2
 */
app.post('/restartProgram', async (req, res) => {
  try {
    const programName = req.body.programName || config.programName;
    const result = await shell.restartPM2Process(programName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /startProgram - Start the main program
 */
app.post('/startProgram', async (req, res) => {
  try {
    const { startupCommand, programCwd, programName } = req.body;

    // If specific command provided, use it; otherwise use config
    if (startupCommand && programCwd) {
      // Execute custom command in specified directory
      const result = await shell.executeCommand(startupCommand, { cwd: programCwd });
      return res.json(result);
    }

    // Use PM2 to start if programName provided
    const name = programName || config.programName;
    const result = await shell.startPM2Process(name);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /stopProgram - Stop the main program
 */
app.post('/stopProgram', async (req, res) => {
  try {
    const programName = req.body.programName || config.programName;
    const result = await shell.stopPM2Process(programName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /restartAgent - Restart the agent itself
 */
app.post('/restartAgent', async (req, res) => {
  try {
    // Send response before restarting
    res.json({
      success: true,
      message: 'Agent restart initiated'
    });

    // Restart after a short delay
    setTimeout(async () => {
      await shell.executeCommand('pm2 restart agent-api');
      process.exit(0);
    }, 1000);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /logs - Get PM2 logs
 */
app.get('/logs', async (req, res) => {
  try {
    const processName = req.query.process || config.programName;
    const lines = parseInt(req.query.lines) || 100;

    const result = await shell.getPM2Logs(processName, lines);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /pm2/list - Get PM2 process list
 */
app.get('/pm2/list', async (req, res) => {
  try {
    const processes = await shell.getPM2List();
    res.json({
      success: true,
      processes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /git/pull - Execute git pull
 */
app.post('/git/pull', async (req, res) => {
  try {
    const directory = req.body.directory || config.programCwd;
    const result = await shell.gitPull(directory);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /git/status - Get git status
 */
app.get('/git/status', async (req, res) => {
  try {
    const directory = req.query.directory || config.programCwd;
    const result = await shell.gitStatus(directory);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /config - Get current configuration
 */
app.get('/config', (req, res) => {
  // Don't send API key
  const { apiKey, ...safeConfig } = config;
  res.json({
    success: true,
    config: safeConfig
  });
});

/**
 * POST /config - Update configuration
 */
app.post('/config', (req, res) => {
  try {
    const updates = req.body;

    // Update config object
    config = { ...config, ...updates };

    // Save to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Don't send API key
    const { apiKey, ...safeConfig } = config;
    res.json({
      success: true,
      message: 'Configuration updated',
      config: safeConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /terminal/create - Create a new terminal session
 */
app.post('/terminal/create', (req, res) => {
  try {
    const { cwd } = req.body;
    const terminalInfo = terminalManager.createTerminal(cwd || config.programCwd);
    res.json({
      success: true,
      terminal: terminalInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /terminal/list - Get all terminal sessions
 */
app.get('/terminal/list', (req, res) => {
  try {
    const terminals = terminalManager.getAllTerminals();
    res.json({
      success: true,
      terminals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /terminal/:id - Kill a terminal session
 */
app.delete('/terminal/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = terminalManager.killTerminal(id);

    if (success) {
      res.json({
        success: true,
        message: 'Terminal killed'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Terminal not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Phone Monitoring Endpoints (ADB)
// ============================================

/**
 * GET /phones/status - Get phone monitoring status
 */
app.get('/phones/status', (req, res) => {
  try {
    const status = adbMonitor.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /phones - Get all configured phones
 */
app.get('/phones', (req, res) => {
  try {
    const phones = adbMonitor.getPhones();
    res.json({
      success: true,
      phones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /phones - Add a new phone
 */
app.post('/phones', (req, res) => {
  try {
    const { serial, name, description } = req.body;

    if (!serial) {
      return res.status(400).json({
        success: false,
        error: 'Serial number is required'
      });
    }

    const result = adbMonitor.addPhone({ serial, name, description });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /phones/:serial - Update phone configuration
 */
app.put('/phones/:serial', (req, res) => {
  try {
    const { serial } = req.params;
    const { name, description } = req.body;

    const result = adbMonitor.updatePhone(serial, { name, description });

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /phones/:serial - Remove a phone
 */
app.delete('/phones/:serial', (req, res) => {
  try {
    const { serial } = req.params;
    const result = adbMonitor.removePhone(serial);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /phones/:serial/reboot - Reboot a phone
 */
app.post('/phones/:serial/reboot', async (req, res) => {
  try {
    const { serial } = req.params;
    const result = await adbMonitor.rebootDevice(serial);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /phones/adb/check - Check ADB availability
 */
app.get('/phones/adb/check', async (req, res) => {
  try {
    const result = await adbMonitor.checkADBAvailability();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');

  // Extract API key from query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const apiKey = url.searchParams.get('apiKey');

  if (!apiKey || apiKey !== config.apiKey) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Unauthorized: Invalid API key'
    }));
    ws.close();
    return;
  }

  let currentTerminalId = null;
  let statsInterval = null;
  let phoneStatusListener = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'terminal.create':
          const terminalInfo = terminalManager.createTerminal(data.cwd || config.programCwd);
          currentTerminalId = terminalInfo.id;
          terminalManager.addClient(currentTerminalId, ws);
          ws.send(JSON.stringify({
            type: 'terminal.created',
            terminal: terminalInfo
          }));
          break;

        case 'terminal.attach':
          if (data.terminalId) {
            currentTerminalId = data.terminalId;
            const success = terminalManager.addClient(currentTerminalId, ws);
            if (success) {
              ws.send(JSON.stringify({
                type: 'terminal.attached',
                terminalId: currentTerminalId
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Terminal not found'
              }));
            }
          }
          break;

        case 'terminal.input':
          if (currentTerminalId) {
            terminalManager.writeToTerminal(currentTerminalId, data.data);
          }
          break;

        case 'terminal.resize':
          if (currentTerminalId) {
            terminalManager.resizeTerminal(currentTerminalId, data.cols, data.rows);
          }
          break;

        case 'stats.start':
          if (statsInterval) {
            clearInterval(statsInterval);
          }
          statsInterval = setInterval(async () => {
            try {
              const stats = await getSystemStats();
              ws.send(JSON.stringify({
                type: 'stats',
                data: stats
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'error',
                message: error.message
              }));
            }
          }, data.interval || 2000);
          break;

        case 'stats.stop':
          if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
          }
          break;

        case 'phones.start':
          // Send initial status
          const initialStatus = adbMonitor.getStatus();
          ws.send(JSON.stringify({
            type: 'phones.status',
            data: initialStatus
          }));

          // Create listener for updates
          phoneStatusListener = (status) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({
                type: 'phones.status',
                data: status
              }));
            }
          };

          adbMonitor.addListener(phoneStatusListener);
          break;

        case 'phones.stop':
          if (phoneStatusListener) {
            adbMonitor.removeListener(phoneStatusListener);
            phoneStatusListener = null;
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (statsInterval) {
      clearInterval(statsInterval);
    }
    if (phoneStatusListener) {
      adbMonitor.removeListener(phoneStatusListener);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
const PORT = config.agentPort || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Agent API running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`Configuration loaded from: ${configPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  terminalManager.killAllTerminals();
  adbMonitor.stopMonitoring();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down...');
  terminalManager.killAllTerminals();
  adbMonitor.stopMonitoring();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
