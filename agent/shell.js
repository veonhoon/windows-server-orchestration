const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Execute a shell command with proper Windows handling
 * @param {string} command - Command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Result with stdout, stderr, and exit code
 */
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      shell: 'cmd.exe',
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10, // 10MB
      ...options
    };

    exec(command, defaultOptions, (error, stdout, stderr) => {
      if (error && error.code !== 0 && !error.killed) {
        // Command failed but we still want to return output
        resolve({
          success: false,
          stdout: stdout || '',
          stderr: stderr || error.message,
          exitCode: error.code || 1,
          error: error.message
        });
      } else {
        resolve({
          success: true,
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: 0
        });
      }
    });
  });
}

/**
 * Get PM2 process list
 * @returns {Promise<Array>} List of PM2 processes
 */
async function getPM2List() {
  try {
    const result = await executeCommand('pm2 jlist');
    if (result.success) {
      try {
        const processes = JSON.parse(result.stdout);
        return processes;
      } catch (e) {
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error('Error getting PM2 list:', error);
    return [];
  }
}

/**
 * Get logs from PM2 for a specific process
 * @param {string} processName - Name of the PM2 process
 * @param {number} lines - Number of lines to retrieve
 * @returns {Promise<Object>} Logs object with out and error logs
 */
async function getPM2Logs(processName, lines = 100) {
  try {
    const result = await executeCommand(`pm2 logs ${processName} --nostream --lines ${lines}`);
    return {
      success: result.success,
      logs: result.stdout,
      error: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      logs: '',
      error: error.message
    };
  }
}

/**
 * Restart a PM2 process
 * @param {string} processName - Name of the PM2 process
 * @returns {Promise<Object>} Result of restart
 */
async function restartPM2Process(processName) {
  try {
    const result = await executeCommand(`pm2 restart ${processName}`);
    return {
      success: result.success,
      message: result.success ? `Process ${processName} restarted successfully` : 'Restart failed',
      output: result.stdout,
      error: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      message: 'Restart failed',
      error: error.message
    };
  }
}

/**
 * Stop a PM2 process
 * @param {string} processName - Name of the PM2 process
 * @returns {Promise<Object>} Result of stop
 */
async function stopPM2Process(processName) {
  try {
    const result = await executeCommand(`pm2 stop ${processName}`);
    return {
      success: result.success,
      message: result.success ? `Process ${processName} stopped successfully` : 'Stop failed',
      output: result.stdout,
      error: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      message: 'Stop failed',
      error: error.message
    };
  }
}

/**
 * Start a PM2 process
 * @param {string} processName - Name of the PM2 process
 * @returns {Promise<Object>} Result of start
 */
async function startPM2Process(processName) {
  try {
    const result = await executeCommand(`pm2 start ${processName}`);
    return {
      success: result.success,
      message: result.success ? `Process ${processName} started successfully` : 'Start failed',
      output: result.stdout,
      error: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      message: 'Start failed',
      error: error.message
    };
  }
}

/**
 * Execute git pull in a directory
 * @param {string} directory - Directory to pull in
 * @returns {Promise<Object>} Result of git pull
 */
async function gitPull(directory) {
  try {
    // Verify directory exists
    if (!fs.existsSync(directory)) {
      return {
        success: false,
        message: 'Directory does not exist',
        error: `Path not found: ${directory}`
      };
    }

    const result = await executeCommand('git pull', { cwd: directory });
    return {
      success: result.success,
      message: result.success ? 'Git pull completed successfully' : 'Git pull failed',
      output: result.stdout,
      error: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      message: 'Git pull failed',
      error: error.message
    };
  }
}

/**
 * Get git status in a directory
 * @param {string} directory - Directory to check
 * @returns {Promise<Object>} Git status
 */
async function gitStatus(directory) {
  try {
    if (!fs.existsSync(directory)) {
      return {
        success: false,
        error: `Path not found: ${directory}`
      };
    }

    const result = await executeCommand('git status', { cwd: directory });
    return {
      success: result.success,
      output: result.stdout,
      error: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  executeCommand,
  getPM2List,
  getPM2Logs,
  restartPM2Process,
  stopPM2Process,
  startPM2Process,
  gitPull,
  gitStatus
};
