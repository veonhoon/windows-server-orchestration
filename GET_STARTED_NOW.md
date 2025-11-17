# 🚀 Get Started Now - Your First 10 Minutes

This guide gets you from zero to a working demo in 10 minutes using just one test server.

## Prerequisites Check (2 minutes)

Run these commands on your Windows server:

```bash
# Check Node.js
node --version
# Should show v16.0.0 or higher

# Check PM2
pm2 --version
# If not installed: npm install -g pm2

# Check npm
npm --version
```

If anything is missing, install it first:
- Node.js: https://nodejs.org/ (Download LTS version)
- PM2: `npm install -g pm2`

## Step 1: Deploy Agent to Test Server (3 minutes)

### On Your Development Machine:

1. Build the agent package:
```bash
cd "control board\build"
build-agent.bat
```

This creates `build\output\server-agent-[timestamp].zip`

### On Your Windows Server:

2. Copy the zip file to your server (any folder)

3. Extract it to: `C:\TestAgent\`

4. Open `C:\TestAgent\agent\config.json` in Notepad and change the API key:
```json
{
  "startupCommand": "npm run start",
  "programCwd": "C:\\TestAgent\\agent",
  "programName": "test-program",
  "agentPort": 3001,
  "apiKey": "my-secret-test-key-123"
}
```
**Important:** Change `my-secret-test-key-123` to something else!

5. Open Command Prompt **as Administrator** and run:
```bash
cd C:\TestAgent\agent
npm install
```

Wait for installation to complete (2-3 minutes).

6. Start the agent:
```bash
pm2 start pm2.json
pm2 list
```

You should see "agent-api" with status "online".

7. Test it:
```bash
curl "http://localhost:3001/?apiKey=my-secret-test-key-123"
```

You should see: `{"success":true,"message":"Agent API is running"...}`

✅ **Agent is working!**

## Step 2: Configure Dashboard (2 minutes)

### On Your Development Machine:

1. Open `dashboard\lib\servers.ts` in your code editor

2. Replace the content with this (use YOUR server's IP and API key):
```typescript
export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  color?: string;
}

export const servers: ServerConfig[] = [
  {
    id: 'test-server',
    name: 'Test Server',
    url: 'http://YOUR_SERVER_IP:3001',  // Change this!
    apiKey: 'my-secret-test-key-123',   // Change this to match your agent!
    color: '#3b82f6'
  }
];

export function getServerById(id: string): ServerConfig | undefined {
  return servers.find(s => s.id === id);
}

export function getWebSocketUrl(server: ServerConfig): string {
  const wsUrl = server.url.replace('https://', 'wss://').replace('http://', 'ws://');
  return `${wsUrl}/ws?apiKey=${encodeURIComponent(server.apiKey)}`;
}
```

**Replace:**
- `YOUR_SERVER_IP` with your server's IP address (e.g., `192.168.1.100`)
- `my-secret-test-key-123` with the same key you used in agent's config.json

3. Save the file

## Step 3: Run Dashboard (2 minutes)

1. Open Command Prompt in the dashboard directory:
```bash
cd dashboard
npm install
```

Wait for installation (2-3 minutes).

2. Start the dashboard:
```bash
npm run dev
```

3. Open your browser and go to:
```
http://localhost:3000
```

## Step 4: Test Everything! (3 minutes)

You should see the dashboard with your "Test Server" in the sidebar.

### Test 1: View System Stats
- You should see CPU, RAM, and Disk usage updating every 2 seconds
- ✅ This means WebSocket connection is working!

### Test 2: View PM2 Processes
- Look at the PM2 Processes section
- You should see "agent-api" listed
- ✅ This means REST API is working!

### Test 3: Run a Command
1. Scroll to "Run Command"
2. Type: `node --version`
3. Click "Run"
4. You should see the Node.js version in the output
- ✅ Remote command execution is working!

### Test 4: Open Terminal
1. Click the "Terminal" tab
2. Wait a few seconds for connection
3. Type: `dir` and press Enter
4. You should see directory contents
- ✅ Interactive terminal is working!

### Test 5: View Logs
1. Click the "Logs" tab
2. Click "Agent Logs"
3. You should see PM2 logs
- ✅ Log viewing is working!

## 🎉 Success!

You now have:
- ✅ Agent running on a Windows server
- ✅ Dashboard connecting to the agent
- ✅ Real-time stats monitoring
- ✅ Command execution
- ✅ Interactive terminal
- ✅ Log viewing

## What's Next?

### Add More Servers (Optional)

Repeat Step 1 for each additional server:
1. Copy agent package to new server
2. Edit config.json with unique API key
3. Install dependencies and start with PM2
4. Add to dashboard's `servers.ts`

### Set Up Production Access

#### Option A: Cloudflare Tunnel (Recommended)
1. Install cloudflared on each server
2. Create a tunnel: `cloudflared tunnel create server1`
3. Configure the tunnel with your domain
4. Update dashboard with `https://` URLs

See [agent/README_windows.md](agent/README_windows.md) for complete Cloudflare setup.

#### Option B: Direct Access
1. Configure Windows Firewall to allow port 3001
2. Use your server's public IP in dashboard
3. **Not recommended for production** (use Cloudflare Tunnel instead)

### Deploy Dashboard to Production

#### Easiest: Vercel
```bash
npm install -g vercel
cd dashboard
vercel
```

#### Or: PM2
```bash
cd dashboard
npm run build
pm2 start npm --name dashboard -- start
pm2 save
```

See [dashboard/README.md](dashboard/README.md) for more deployment options.

### Configure Auto-Start on Boot

On each server:
```bash
pm2 startup
# Run the command it shows
pm2 save
```

Now your agent will start automatically when Windows boots!

### Set Up Your Main Program

If you have a Node.js application to manage:

1. Create `ecosystem.config.js` in your program directory:
```javascript
module.exports = {
  apps: [{
    name: 'my-app',
    script: 'index.js',
    cwd: 'C:\\MyApp',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

2. Start it with PM2:
```bash
cd C:\MyApp
pm2 start ecosystem.config.js
pm2 save
```

3. Update agent's config.json:
```json
{
  "programName": "my-app",
  "programCwd": "C:\\MyApp"
}
```

4. Now you can restart your app from the dashboard!

## Common Issues & Quick Fixes

### Dashboard shows "Disconnected"
```bash
# On server, check agent is running:
pm2 list

# If not running:
pm2 start agent-api

# Check logs:
pm2 logs agent-api
```

### Terminal won't open
```bash
# On server, reinstall node-pty:
cd C:\TestAgent\agent
npm install --build-from-source node-pty
pm2 restart agent-api
```

### Can't connect from another computer
```bash
# On server, allow port through firewall:
netsh advfirewall firewall add rule name="Agent API" dir=in action=allow protocol=TCP localport=3001
```

### Stats not updating
- Refresh the browser page
- Check WebSocket connection in browser DevTools (Network tab)
- Check agent logs: `pm2 logs agent-api`

## Cheat Sheet

### Server Commands
```bash
# View all processes
pm2 list

# View agent logs
pm2 logs agent-api

# Restart agent
pm2 restart agent-api

# Stop agent
pm2 stop agent-api

# Test agent locally
curl "http://localhost:3001/?apiKey=YOUR_KEY"

# Check what's using port 3001
netstat -ano | findstr :3001
```

### Dashboard Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Learning Path

Now that you have it working:

1. ✅ **You are here** - Basic setup complete
2. 📚 Read [README.md](README.md) - Understand the full system
3. 🔒 Review [agent/README_windows.md](agent/README_windows.md) - Security & deployment
4. 🎨 Explore [dashboard/README.md](dashboard/README.md) - Customization options
5. 📊 Check [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) - Architecture details
6. 📋 Use [DEPLOYMENT_CHECKLIST.md](build/DEPLOYMENT_CHECKLIST.md) - Multi-server deployment

## Support

Stuck? Check these in order:

1. **PM2 Logs**: `pm2 logs agent-api` (shows agent errors)
2. **Browser Console**: F12 in browser (shows dashboard errors)
3. **Network Tab**: F12 → Network (shows connection issues)
4. **Test Locally**: `curl http://localhost:3001/?apiKey=YOUR_KEY`
5. **Check Firewall**: Windows Firewall settings
6. **Restart Everything**: `pm2 restart all`

## Tips & Tricks

💡 **Bookmark your dashboard** - Add http://localhost:3000 to favorites

💡 **Use descriptive server names** - "Production-US-East" is better than "Server 1"

💡 **Change API keys regularly** - Security best practice

💡 **Keep dashboard open** - Monitor all servers at a glance

💡 **Use colors** - Assign different colors to each server for quick identification

💡 **Test before deploying** - Always test commands in terminal first

💡 **Check logs regularly** - `pm2 logs` shows what's happening

💡 **Save PM2 state** - Run `pm2 save` after any changes

## What You've Learned

In 10 minutes, you've:
- ✅ Deployed a Node.js agent to a Windows server
- ✅ Configured PM2 process management
- ✅ Set up a Next.js dashboard
- ✅ Established REST + WebSocket communication
- ✅ Tested real-time monitoring
- ✅ Executed remote commands
- ✅ Opened an interactive terminal

You're now ready to manage multiple Windows servers remotely! 🎉

---

**Need help? Check the documentation files in this project. Everything is explained in detail!**

---

## Your Next Goal: Add Another Server

Take what you learned and deploy to a second server:
1. Copy agent package to Server 2
2. Edit config.json (different API key!)
3. `npm install` and `pm2 start pm2.json`
4. Add to dashboard's `servers.ts`
5. Switch between servers in the dashboard

**You've got this! 💪**
