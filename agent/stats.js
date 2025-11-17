const si = require('systeminformation');

/**
 * Get current system statistics
 * @returns {Promise<Object>} System stats including CPU, RAM, and Disk
 */
async function getSystemStats() {
  try {
    const [cpu, mem, disk, currentLoad, osInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.currentLoad(),
      si.osInfo()
    ]);

    // Calculate disk stats for C: drive (primary Windows drive)
    const cDrive = disk.find(d => d.mount.toLowerCase().includes('c:')) || disk[0] || {};

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
        usage: Math.round(currentLoad.currentLoad * 100) / 100
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercent: Math.round((mem.used / mem.total) * 10000) / 100
      },
      disk: {
        size: cDrive.size || 0,
        used: cDrive.used || 0,
        available: cDrive.available || 0,
        usagePercent: Math.round((cDrive.use || 0) * 100) / 100,
        mount: cDrive.mount || 'C:'
      },
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
        hostname: osInfo.hostname
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
}

/**
 * Get stats continuously and send via callback
 * @param {Function} callback - Called with stats every interval
 * @param {number} interval - Milliseconds between updates
 * @returns {Function} Stop function
 */
function startStatsStream(callback, interval = 2000) {
  const intervalId = setInterval(async () => {
    try {
      const stats = await getSystemStats();
      callback(stats);
    } catch (error) {
      callback({ error: error.message });
    }
  }, interval);

  return () => clearInterval(intervalId);
}

module.exports = {
  getSystemStats,
  startStatsStream
};
