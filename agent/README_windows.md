# Agent API - Windows Setup Guide

This is the remote agent that runs on each Windows server you want to control from the central dashboard.

## Prerequisites

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PM2** (Process Manager)
   ```cmd
   npm install -g pm2
   pm2 --version
   ```

3. **Windows Build Tools** (required for node-pty)
   ```cmd
   npm install -g windows-build-tools
   ```
   Or install Visual Studio Build Tools manually from:
   https://visualstudio.microsoft.com/downloads/

4. **Git** (optional, for git pull functionality)
   - Download from: https://git-scm.com/download/win

## Installation

### Step 1: Extract and Install Dependencies

1. Extract the agent folder to your desired location (e.g., `C:\ServerAgent\`)
2. Open Command Prompt **as Administrator**
3. Navigate to the agent directory:
   ```cmd
   cd C:\ServerAgent\agent
   ```
4. Install dependencies:
   ```cmd
   npm install
   ```

### Step 2: Configure the Agent

Edit `config.json` with your server-specific settings:

```json
{
  "startupCommand": "npm run start",
  "programCwd": "C:\\MyPrograms\\server-program",
  "programName": "server-program",
  "agentPort": 3001,
  "apiKey": "your-secret-api-key-change-this"
}
```

**Configuration Options:**
- `startupCommand`: Command to start your main program
- `programCwd`: Working directory for your main program
- `programName`: PM2 process name for your main program
- `agentPort`: Port the agent API will listen on (default: 3001)
- `apiKey`: Secret API key for authentication (CHANGE THIS!)

**Example for Server 1:**
```json
{
  "startupCommand": "npm run start-server-1",
  "programCwd": "C:\\Projects\\MyApp\\server-1",
  "programName": "server-program-1",
  "agentPort": 3001,
  "apiKey": "super-secret-key-12345-server-1"
}
```

**Example for Server 2:**
```json
{
  "startupCommand": "npm run start-server-2",
  "programCwd": "C:\\Projects\\MyApp\\server-2",
  "programName": "server-program-2",
  "agentPort": 3001,
  "apiKey": "super-secret-key-67890-server-2"
}
```

### Step 3: Start the Agent with PM2

1. Start the agent:
   ```cmd
   pm2 start pm2.json
   ```

2. Verify it's running:
   ```cmd
   pm2 list
   ```
   You should see `agent-api` in the list.

3. View logs:
   ```cmd
   pm2 logs agent-api
   ```

4. Save PM2 configuration (so it persists after reboot):
   ```cmd
   pm2 save
   ```

### Step 4: Configure PM2 to Start on Boot

Set PM2 to start automatically when Windows boots:

```cmd
pm2 startup
```

Follow the instructions shown. Then run:

```cmd
pm2 save
```

### Step 5: Firewall Configuration

If accessing the agent remotely, open the port in Windows Firewall:

```cmd
netsh advfirewall firewall add rule name="Agent API" dir=in action=allow protocol=TCP localport=3001
```

(Replace 3001 with your configured port)

## Testing the Agent

Test that the agent is accessible:

```cmd
curl http://localhost:3001/?apiKey=your-secret-api-key-change-this
```

You should see:
```json
{
  "success": true,
  "message": "Agent API is running",
  "version": "1.0.0",
  "timestamp": "..."
}
```

## Setting Up Your Main Program

Your main program should also run under PM2 so the agent can control it.

### Example PM2 Ecosystem File for Your Program

Create `C:\Projects\MyApp\ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'server-program',
    script: 'index.js',
    cwd: 'C:\\Projects\\MyApp',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start your program:
```cmd
cd C:\Projects\MyApp
pm2 start ecosystem.config.js
pm2 save
```

## Cloudflare Tunnel Setup (Optional)

To expose your agent securely to the internet:

### Step 1: Install Cloudflare Tunnel

1. Download cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Authenticate:
   ```cmd
   cloudflared tunnel login
   ```

### Step 2: Create a Tunnel

```cmd
cloudflared tunnel create server1-agent
```

This creates a tunnel and gives you a tunnel ID.

### Step 3: Configure the Tunnel

Create `C:\ServerAgent\.cloudflared\config.yml`:

```yaml
tunnel: your-tunnel-id
credentials-file: C:\Users\YourUser\.cloudflared\your-tunnel-id.json

ingress:
  - hostname: server1-agent.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

### Step 4: Create DNS Record

```cmd
cloudflared tunnel route dns server1-agent server1-agent.yourdomain.com
```

### Step 5: Run the Tunnel

```cmd
cloudflared tunnel run server1-agent
```

Or install as a service:
```cmd
cloudflared service install
```

Now your agent is accessible at: `https://server1-agent.yourdomain.com`

## Agent API Endpoints

All endpoints require the `X-API-Key` header or `?apiKey=` query parameter.

### Health Check
```
GET /
```

### System Stats
```
GET /stats
Returns CPU, RAM, disk usage
```

### Run Command
```
POST /run
Body: { "command": "dir", "cwd": "C:\\optional\\path" }
```

### Restart Main Program
```
POST /restartProgram
Body: { "programName": "server-program" }  // optional
```

### Start Main Program
```
POST /startProgram
```

### Stop Main Program
```
POST /stopProgram
```

### Restart Agent
```
POST /restartAgent
```

### Get Logs
```
GET /logs?process=server-program&lines=100
```

### PM2 Process List
```
GET /pm2/list
```

### Git Pull
```
POST /git/pull
Body: { "directory": "C:\\Projects\\MyApp" }  // optional
```

### Git Status
```
GET /git/status?directory=C:\\Projects\\MyApp
```

### Get Configuration
```
GET /config
```

### Update Configuration
```
POST /config
Body: { "startupCommand": "npm start", ... }
```

### Terminal - Create Session
```
POST /terminal/create
Body: { "cwd": "C:\\optional\\path" }
```

### Terminal - List Sessions
```
GET /terminal/list
```

### Terminal - Kill Session
```
DELETE /terminal/:id
```

### WebSocket Terminal
```
ws://localhost:3001/ws?apiKey=your-key

Messages:
- { "type": "terminal.create", "cwd": "C:\\path" }
- { "type": "terminal.attach", "terminalId": "term-1" }
- { "type": "terminal.input", "data": "command\r" }
- { "type": "terminal.resize", "cols": 80, "rows": 30 }
- { "type": "stats.start", "interval": 2000 }
- { "type": "stats.stop" }
```

## Common PM2 Commands

```cmd
# List all processes
pm2 list

# View logs
pm2 logs agent-api
pm2 logs server-program

# Restart processes
pm2 restart agent-api
pm2 restart server-program

# Stop processes
pm2 stop agent-api
pm2 stop server-program

# Delete from PM2
pm2 delete agent-api

# Monitor in real-time
pm2 monit

# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect
```

## Troubleshooting

### Agent won't start
1. Check Node.js version: `node --version` (should be v16+)
2. Check logs: `pm2 logs agent-api`
3. Verify config.json is valid JSON
4. Check port isn't already in use: `netstat -ano | findstr :3001`

### node-pty installation fails
1. Install windows-build-tools: `npm install -g windows-build-tools`
2. Or install Visual Studio Build Tools
3. Run Command Prompt as Administrator
4. Try: `npm install --build-from-source`

### Can't connect remotely
1. Check Windows Firewall settings
2. Verify agent is listening on 0.0.0.0: check server.js
3. Test locally first: `curl http://localhost:3001/?apiKey=your-key`
4. Check router port forwarding if needed

### PM2 doesn't start on boot
1. Re-run: `pm2 startup`
2. Execute the command it shows
3. Run: `pm2 save`
4. Restart Windows and verify: `pm2 list`

### Terminal not working
1. Ensure node-pty is properly installed
2. Check Windows ConPTY is available (Windows 10 1809+)
3. Try using PowerShell instead: modify terminal.js shell variable

## Security Recommendations

1. **Use strong API keys**: Generate long random strings
2. **Use Cloudflare Tunnel**: Don't expose ports directly
3. **Restrict IP access**: Use firewall rules if not using Cloudflare
4. **Different keys per server**: Each server should have unique API key
5. **HTTPS only**: Always use HTTPS in production
6. **Regular updates**: Keep Node.js and dependencies updated

## Updating the Agent

1. Stop the agent:
   ```cmd
   pm2 stop agent-api
   ```

2. Pull updates or replace files:
   ```cmd
   cd C:\ServerAgent\agent
   git pull
   npm install
   ```

3. Restart:
   ```cmd
   pm2 restart agent-api
   ```

## Uninstalling

1. Stop and delete from PM2:
   ```cmd
   pm2 stop agent-api
   pm2 delete agent-api
   pm2 save
   ```

2. Remove from startup:
   ```cmd
   pm2 unstartup
   ```

3. Delete the agent directory

## Support

For issues, check:
- PM2 logs: `pm2 logs agent-api`
- Windows Event Viewer
- Network connectivity: `netstat -ano | findstr :3001`

## License

MIT
