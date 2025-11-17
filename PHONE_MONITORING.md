# Phone Monitoring Feature

## Overview

The Phone Monitoring feature allows you to track Android devices connected via ADB (Android Debug Bridge) to each server. You can monitor their status (online, offline, unauthorized), view device information, and manage devices from the centralized dashboard.

## Features

✨ **Real-Time Monitoring**
- Automatically detects ADB-connected devices every 5 seconds
- Real-time status updates via WebSocket
- Track online, offline, and unauthorized status

📱 **Device Management**
- Add phones by serial number
- Assign custom names and descriptions
- Easy editing and removal
- Move devices between servers

📊 **Device Information**
- Device model and Android version
- Battery level (for online devices)
- Last seen timestamp
- Connection status

🔧 **Device Control**
- Reboot devices remotely
- View device details
- Quick status overview

## Prerequisites

### On Each Server

1. **Install ADB (Android Debug Bridge)**

   **Windows:**
   ```cmd
   # Option 1: Via Chocolatey
   choco install adb

   # Option 2: Download Android Platform Tools
   # https://developer.android.com/studio/releases/platform-tools
   # Extract and add to PATH
   ```

2. **Verify ADB Installation**
   ```cmd
   adb version
   ```

3. **Connect Android Devices**
   - Connect phones via USB
   - Enable USB Debugging on each phone:
     - Go to Settings → About Phone
     - Tap "Build Number" 7 times to enable Developer Options
     - Go to Settings → Developer Options
     - Enable "USB Debugging"
   - Authorize the computer when prompted on the phone

4. **Test ADB Connection**
   ```cmd
   adb devices
   ```

   You should see your devices listed:
   ```
   List of devices attached
   1234567890ABCDEF    device
   ```

## Configuration

### Agent Configuration

The agent automatically loads phone configurations from `phones.json` in the agent directory.

**Example `phones.json`:**
```json
{
  "phones": [
    {
      "serial": "1234567890ABCDEF",
      "name": "Phone 1",
      "description": "Test device for Server 1",
      "addedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "serial": "FEDCBA0987654321",
      "name": "Phone 2",
      "description": "Production device",
      "addedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Dashboard Configuration

No additional configuration needed. The Phones tab will automatically appear in the dashboard.

## Usage

### Adding a Phone

1. **Open the Dashboard**
   - Navigate to your server dashboard
   - Click on the **Phones** tab

2. **Click "Add Phone"**
   - Enter the device serial number (from `adb devices`)
   - Optionally enter a friendly name
   - Optionally add a description
   - Click "Add Phone"

3. **Verify**
   - The phone will appear in the list
   - Status will update automatically

### Editing a Phone

1. Click the ✏️ (edit) icon on any phone card
2. Update the name or description
3. Click "Save Changes"

### Removing a Phone

1. Click the 🗑️ (delete) icon on any phone card
2. Confirm the deletion
3. The phone will be removed from monitoring

### Rebooting a Phone

1. Ensure the phone status is "online"
2. Click the 🔄 (reboot) icon
3. Confirm the reboot
4. The phone will restart

### Moving a Phone Between Servers

**Method 1: Via Dashboard**
1. Remove the phone from Server A
2. Add the phone to Server B with the same serial number

**Method 2: Via phones.json**
1. Edit `phones.json` on Server A - remove the phone
2. Edit `phones.json` on Server B - add the phone
3. Restart both agents: `pm2 restart agent-api`

## Phone Status Indicators

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| **Online** | ● | Green | Device is connected and authorized |
| **Offline** | ○ | Gray | Device not detected by ADB |
| **Unauthorized** | ⚠ | Amber | Device connected but not authorized |

### Status Summary

The dashboard shows a summary at the top:
- **Total**: Total number of configured phones
- **Online**: Currently connected and working
- **Offline**: Not detected
- **Unauthorized**: Connected but need authorization

## API Endpoints

### Get Phone Status
```
GET /phones/status

Response:
{
  "success": true,
  "isMonitoring": true,
  "totalDevices": 3,
  "online": 2,
  "offline": 0,
  "unauthorized": 1,
  "devices": [...],
  "lastUpdate": "2024-01-15T12:00:00.000Z"
}
```

### Get All Phones
```
GET /phones

Response:
{
  "success": true,
  "phones": [
    {
      "serial": "1234567890ABCDEF",
      "name": "Phone 1",
      "description": "Test device",
      "currentStatus": "online",
      "model": "Pixel 6",
      "androidVersion": "13",
      "batteryLevel": 85,
      "lastSeen": "2024-01-15T12:00:00.000Z",
      "addedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Add Phone
```
POST /phones
Content-Type: application/json
X-API-Key: your-api-key

{
  "serial": "1234567890ABCDEF",
  "name": "Phone 1",
  "description": "Test device"
}

Response:
{
  "success": true,
  "message": "Phone added successfully",
  "phone": {...}
}
```

### Update Phone
```
PUT /phones/:serial
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Updated Name",
  "description": "Updated description"
}

Response:
{
  "success": true,
  "message": "Phone updated successfully",
  "phone": {...}
}
```

### Remove Phone
```
DELETE /phones/:serial
X-API-Key: your-api-key

Response:
{
  "success": true,
  "message": "Phone removed successfully"
}
```

### Reboot Phone
```
POST /phones/:serial/reboot
X-API-Key: your-api-key

Response:
{
  "success": true,
  "message": "Device reboot initiated"
}
```

### Check ADB Availability
```
GET /phones/adb/check
X-API-Key: your-api-key

Response:
{
  "success": true,
  "available": true,
  "version": "Android Debug Bridge version 1.0.41"
}
```

## WebSocket Updates

Subscribe to real-time phone status updates:

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://server1.yourdomain.com/ws?apiKey=your-key');

// Start receiving phone updates
ws.send(JSON.stringify({
  type: 'phones.start'
}));

// Handle updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'phones.status') {
    console.log('Phone status update:', data.data);
  }
};

// Stop receiving updates
ws.send(JSON.stringify({
  type: 'phones.stop'
}));
```

## Troubleshooting

### Phones Not Appearing

**Check ADB is installed:**
```cmd
adb version
```

**Check devices are connected:**
```cmd
adb devices
```

**Check agent logs:**
```cmd
pm2 logs agent-api
```

**Restart ADB server:**
```cmd
adb kill-server
adb start-server
adb devices
```

### "Unauthorized" Status

**Solution:**
1. Unplug the USB cable from the phone
2. Replug the cable
3. On the phone, tap "Always allow from this computer"
4. Tap "OK" to authorize

### Phone Shows as Offline

**Possible causes:**
1. USB cable disconnected
2. USB Debugging disabled on phone
3. ADB server not running
4. Phone not in phones.json

**Check:**
```cmd
# List connected devices
adb devices

# If device shows, add it to dashboard
# If device doesn't show, check USB connection and phone settings
```

### Battery Level Not Showing

Battery level only appears for devices with status "online". Offline and unauthorized devices won't show battery information.

### Multiple Servers with Same Phone

**Warning:** Don't add the same phone serial to multiple servers. A phone can only be connected to one computer at a time.

If you need to move a phone:
1. Disconnect from Server A
2. Remove from Server A's configuration
3. Connect to Server B
4. Add to Server B's configuration

## Best Practices

### Naming Convention

Use consistent naming:
- `Server1-Phone1`, `Server1-Phone2`
- `US-East-Device1`, `US-East-Device2`
- `Test-Pixel6-001`, `Prod-Galaxy-001`

### Descriptions

Include useful information:
- Purpose: "Production testing device"
- Owner: "Assigned to QA team"
- Notes: "Used for automated tests"

### Organization

Group phones by:
- **Server location**: All phones for one datacenter
- **Purpose**: Test devices vs production devices
- **Team**: QA team devices, Dev team devices

### Monitoring

- Check the Phones tab daily
- Investigate offline devices
- Fix unauthorized devices promptly
- Keep phone configurations in version control (except API keys)

## Security Considerations

1. **USB Debugging** is a security risk - only enable on test devices
2. **Physical security** - keep servers with connected phones in secure locations
3. **ADB over network** - avoid unless necessary, use with caution
4. **API keys** - keep unique per server
5. **Authorization** - always authorize only trusted computers

## Advanced Configuration

### Custom Update Interval

Edit `agent/server.js`:
```javascript
// Change from 5000 (5 seconds) to your preferred interval
adbMonitor.startMonitoring(10000); // 10 seconds
```

### ADB over Network

**Enable on phone:**
```cmd
# Connect via USB first
adb tcpip 5555

# Disconnect USB, then connect over network
adb connect 192.168.1.100:5555
```

**Note:** This is less secure. Only use on trusted networks.

### Multiple Phone Assignments

For complex setups:
1. Create `phones.json` templates for each server
2. Use environment-specific configurations
3. Automate phone assignment via scripts

## Integration Examples

### Automated Testing

```javascript
// Check if test phones are online before running tests
const response = await fetch('http://server1.com:3001/phones/status', {
  headers: { 'X-API-Key': 'your-key' }
});

const { online } = await response.json();

if (online < 3) {
  console.error('Not enough phones online for testing');
  process.exit(1);
}

// Proceed with tests...
```

### Monitoring Scripts

```javascript
// Alert if phones go offline
setInterval(async () => {
  const status = await getPhoneStatus();

  if (status.offline > 0) {
    sendAlert(`${status.offline} phones are offline!`);
  }

  if (status.unauthorized > 0) {
    sendAlert(`${status.unauthorized} phones need authorization!`);
  }
}, 60000); // Check every minute
```

## FAQ

**Q: How many phones can I monitor per server?**
A: There's no hard limit, but USB bandwidth limits practical usage to around 10-20 phones per server.

**Q: Can I monitor phones wirelessly?**
A: Yes, via ADB over network, but it's less reliable and secure.

**Q: What happens if I restart the server?**
A: PM2 will restart the agent automatically. USB connections usually survive reboots, but may need re-authorization.

**Q: Can I see phone screens?**
A: Not with this feature, but you can use `adb shell screencap` or third-party tools.

**Q: Does this work with iOS devices?**
A: No, this feature is Android-specific (requires ADB).

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release
- Real-time ADB device monitoring
- Add/edit/remove phone management
- WebSocket status updates
- Device information display
- Remote reboot functionality

## Support

For issues:
1. Check agent logs: `pm2 logs agent-api`
2. Verify ADB: `adb devices`
3. Check phones.json is valid JSON
4. Restart agent: `pm2 restart agent-api`

---

**Ready to monitor your phones! 📱**
