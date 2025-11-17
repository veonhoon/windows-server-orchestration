const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * ADB Device Monitor
 * Tracks phone status (online, offline, unauthorized) via ADB
 */

class ADBMonitor {
  constructor(configPath) {
    this.configPath = configPath;
    this.devices = new Map();
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.listeners = new Set();
    this.loadPhoneConfig();
  }

  /**
   * Load phone configuration from phones.json
   */
  loadPhoneConfig() {
    try {
      const phonesPath = path.join(path.dirname(this.configPath), 'phones.json');
      if (fs.existsSync(phonesPath)) {
        const data = JSON.parse(fs.readFileSync(phonesPath, 'utf8'));
        this.phoneConfig = data.phones || [];
      } else {
        // Create default config
        this.phoneConfig = [];
        this.savePhoneConfig();
      }
    } catch (error) {
      console.error('Error loading phone config:', error);
      this.phoneConfig = [];
    }
  }

  /**
   * Save phone configuration to phones.json
   */
  savePhoneConfig() {
    try {
      const phonesPath = path.join(path.dirname(this.configPath), 'phones.json');
      fs.writeFileSync(phonesPath, JSON.stringify({ phones: this.phoneConfig }, null, 2));
    } catch (error) {
      console.error('Error saving phone config:', error);
    }
  }

  /**
   * Execute ADB command
   * @param {string} command - ADB command to execute
   * @returns {Promise<Object>} Command result
   */
  executeADB(command) {
    return new Promise((resolve) => {
      exec(`adb ${command}`, { timeout: 10000 }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          stdout: stdout || '',
          stderr: stderr || '',
          error: error ? error.message : null
        });
      });
    });
  }

  /**
   * Get list of connected ADB devices
   * @returns {Promise<Array>} List of devices with status
   */
  async getADBDevices() {
    try {
      const result = await this.executeADB('devices');

      if (!result.success) {
        return {
          success: false,
          error: 'ADB command failed',
          devices: []
        };
      }

      const lines = result.stdout.split('\n');
      const devices = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('*')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            const serial = parts[0];
            const status = parts[1];

            devices.push({
              serial,
              status: status === 'device' ? 'online' : status,
              lastSeen: new Date().toISOString()
            });
          }
        }
      }

      return {
        success: true,
        devices
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        devices: []
      };
    }
  }

  /**
   * Get detailed device information
   * @param {string} serial - Device serial number
   * @returns {Promise<Object>} Device details
   */
  async getDeviceDetails(serial) {
    try {
      const modelResult = await this.executeADB(`-s ${serial} shell getprop ro.product.model`);
      const androidResult = await this.executeADB(`-s ${serial} shell getprop ro.build.version.release`);
      const batteryResult = await this.executeADB(`-s ${serial} shell dumpsys battery`);

      const model = modelResult.stdout.trim();
      const androidVersion = androidResult.stdout.trim();

      // Parse battery level
      let batteryLevel = null;
      if (batteryResult.success) {
        const batteryMatch = batteryResult.stdout.match(/level:\s*(\d+)/);
        if (batteryMatch) {
          batteryLevel = parseInt(batteryMatch[1]);
        }
      }

      return {
        model: model || 'Unknown',
        androidVersion: androidVersion || 'Unknown',
        batteryLevel
      };
    } catch (error) {
      return {
        model: 'Unknown',
        androidVersion: 'Unknown',
        batteryLevel: null
      };
    }
  }

  /**
   * Update device status
   */
  async updateDeviceStatus() {
    const adbResult = await this.getADBDevices();
    const currentDevices = new Map();

    if (adbResult.success) {
      // Process detected devices
      for (const device of adbResult.devices) {
        const configDevice = this.phoneConfig.find(p => p.serial === device.serial);

        let deviceInfo = {
          serial: device.serial,
          status: device.status,
          lastSeen: device.lastSeen,
          name: configDevice ? configDevice.name : device.serial,
          description: configDevice ? configDevice.description : '',
          model: 'Unknown',
          androidVersion: 'Unknown',
          batteryLevel: null
        };

        // Get detailed info for online devices
        if (device.status === 'online') {
          const details = await this.getDeviceDetails(device.serial);
          deviceInfo = { ...deviceInfo, ...details };
        }

        currentDevices.set(device.serial, deviceInfo);
        this.devices.set(device.serial, deviceInfo);
      }
    }

    // Mark configured devices not found as offline
    for (const configDevice of this.phoneConfig) {
      if (!currentDevices.has(configDevice.serial)) {
        const lastDevice = this.devices.get(configDevice.serial);
        this.devices.set(configDevice.serial, {
          serial: configDevice.serial,
          status: 'offline',
          lastSeen: lastDevice ? lastDevice.lastSeen : new Date().toISOString(),
          name: configDevice.name,
          description: configDevice.description,
          model: lastDevice ? lastDevice.model : 'Unknown',
          androidVersion: lastDevice ? lastDevice.androidVersion : 'Unknown',
          batteryLevel: null
        });
      }
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Add a listener for device status changes
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Remove a listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in listener callback:', error);
      }
    });
  }

  /**
   * Start monitoring devices
   * @param {number} interval - Update interval in milliseconds (default: 5000)
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Initial update
    this.updateDeviceStatus();

    // Set up interval
    this.monitorInterval = setInterval(() => {
      this.updateDeviceStatus();
    }, interval);

    console.log(`ADB monitoring started (interval: ${interval}ms)`);
  }

  /**
   * Stop monitoring devices
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('ADB monitoring stopped');
  }

  /**
   * Get current status of all devices
   * @returns {Object} Status summary
   */
  getStatus() {
    const devices = Array.from(this.devices.values());

    return {
      isMonitoring: this.isMonitoring,
      totalDevices: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      unauthorized: devices.filter(d => d.status === 'unauthorized').length,
      devices: devices.sort((a, b) => a.name.localeCompare(b.name)),
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Add a new phone to configuration
   * @param {Object} phone - Phone configuration
   * @returns {Object} Result
   */
  addPhone(phone) {
    try {
      if (!phone.serial) {
        return { success: false, error: 'Serial number is required' };
      }

      if (this.phoneConfig.find(p => p.serial === phone.serial)) {
        return { success: false, error: 'Phone with this serial already exists' };
      }

      const newPhone = {
        serial: phone.serial,
        name: phone.name || phone.serial,
        description: phone.description || '',
        addedAt: new Date().toISOString()
      };

      this.phoneConfig.push(newPhone);
      this.savePhoneConfig();
      this.updateDeviceStatus();

      return {
        success: true,
        message: 'Phone added successfully',
        phone: newPhone
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update phone configuration
   * @param {string} serial - Serial number
   * @param {Object} updates - Updates to apply
   * @returns {Object} Result
   */
  updatePhone(serial, updates) {
    try {
      const index = this.phoneConfig.findIndex(p => p.serial === serial);

      if (index === -1) {
        return { success: false, error: 'Phone not found' };
      }

      // Update allowed fields
      if (updates.name !== undefined) {
        this.phoneConfig[index].name = updates.name;
      }
      if (updates.description !== undefined) {
        this.phoneConfig[index].description = updates.description;
      }

      this.savePhoneConfig();
      this.updateDeviceStatus();

      return {
        success: true,
        message: 'Phone updated successfully',
        phone: this.phoneConfig[index]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove a phone from configuration
   * @param {string} serial - Serial number
   * @returns {Object} Result
   */
  removePhone(serial) {
    try {
      const index = this.phoneConfig.findIndex(p => p.serial === serial);

      if (index === -1) {
        return { success: false, error: 'Phone not found' };
      }

      const removed = this.phoneConfig.splice(index, 1)[0];
      this.devices.delete(serial);
      this.savePhoneConfig();

      return {
        success: true,
        message: 'Phone removed successfully',
        phone: removed
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all configured phones
   * @returns {Array} List of phones
   */
  getPhones() {
    return this.phoneConfig.map(p => {
      const device = this.devices.get(p.serial);
      return {
        ...p,
        currentStatus: device ? device.status : 'offline',
        model: device ? device.model : 'Unknown',
        androidVersion: device ? device.androidVersion : 'Unknown',
        batteryLevel: device ? device.batteryLevel : null,
        lastSeen: device ? device.lastSeen : null
      };
    });
  }

  /**
   * Reboot a device
   * @param {string} serial - Device serial number
   * @returns {Promise<Object>} Result
   */
  async rebootDevice(serial) {
    try {
      const result = await this.executeADB(`-s ${serial} reboot`);
      return {
        success: result.success,
        message: result.success ? 'Device reboot initiated' : 'Failed to reboot device',
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if ADB is available
   * @returns {Promise<Object>} ADB availability status
   */
  async checkADBAvailability() {
    try {
      const result = await this.executeADB('version');
      return {
        available: result.success,
        version: result.success ? result.stdout.split('\n')[0] : null,
        error: result.error
      };
    } catch (error) {
      return {
        available: false,
        version: null,
        error: error.message
      };
    }
  }
}

module.exports = ADBMonitor;
