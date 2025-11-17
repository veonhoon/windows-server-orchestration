# Quick Start Guide

Get your multi-server orchestration system up and running in 30 minutes!

## Prerequisites Checklist

Ensure you have:
- [ ] Windows 10/Server 2016+ on all servers
- [ ] Node.js v16+ installed everywhere
- [ ] PM2 installed globally: `npm install -g pm2`
- [ ] Windows Build Tools: `npm install -g windows-build-tools`

## 5-Step Deployment

### Step 1: Build Agent Package (2 minutes)

On your development machine:

```bash
cd "control board\build"
build-agent.bat
```

This creates `build/output/server-agent-[timestamp].zip`

### Step 2: Deploy to First Server (10 minutes)

1. Copy the zip to your first Windows server
2. Extract to `C:\ServerAgent\agent\`
3. Edit `config.json`:

```json
{
  "startupCommand": "npm run start",
  "programCwd": "C:\\MyPrograms\\server-program",
  "programName": "server-program",
  "agentPort": 3001,
  "apiKey": "change-this-unique-key-123"
}
```

4. Run these commands as Administrator:

```bash
cd C:\ServerAgent\agent
npm install
pm2 start pm2.json
pm2 save
pm2 startup
```

5. Test it works:

```bash
curl http://localhost:3001/?apiKey=change-this-unique-key-123
```

You should see: `{"success":true,"message":"Agent API is running"...}`

### Step 3: Repeat for Other Servers (10 minutes each)

Do Step 2 for each additional server, making sure to:
- Change the `apiKey` to something unique for each server
- Update `programCwd` and `programName` for each server
- Update `startupCommand` if different per server

### Step 4: Configure Dashboard (3 minutes)

Edit `dashboard/lib/servers.ts`:

```typescript
export const servers: ServerConfig[] = [
  {
    id: 'server-1',
    name: 'My First Server',
    url: 'http://192.168.1.100:3001',  // or https://server1.yourdomain.com
    apiKey: 'change-this-unique-key-123',
    color: '#3b82f6'
  },
  {
    id: 'server-2',
    name: 'My Second Server',
    url: 'http://192.168.1.101:3001',
    apiKey: 'different-unique-key-456',
    color: '#10b981'
  },
  // Add more servers...
];
```

### Step 5: Run Dashboard (2 minutes)

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000 - You're done! 🎉

## What You Can Do Now

✅ View real-time CPU, RAM, disk stats for all servers
✅ Run commands on any server
✅ Open an interactive terminal
✅ Restart your programs via PM2
✅ View logs from any server
✅ Execute git pull on any server
✅ Edit server configurations remotely

## Next Steps

### Optional: Set Up Cloudflare Tunnel (Recommended for Production)

Instead of exposing ports, use Cloudflare Tunnel:

```bash
# Install cloudflared
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create server1-agent

# Configure
# Create config.yml with your tunnel settings

# Install as service
cloudflared service install

# Start
sc start cloudflared
```

Update dashboard `servers.ts` with your tunnel URLs:
```typescript
url: 'https://server1-agent.yourdomain.com'
```

### Optional: Deploy Dashboard to Production

**Vercel (Easiest):**
```bash
npm install -g vercel
cd dashboard
vercel
```

**PM2:**
```bash
cd dashboard
npm run build
pm2 start npm --name dashboard -- start
pm2 save
```

**Docker:**
```bash
cd dashboard
docker build -t dashboard .
docker run -p 3000:3000 dashboard
```

## Troubleshooting

### Agent won't start
```bash
# Check logs
pm2 logs agent-api

# Verify config.json is valid JSON
# Check port isn't in use
netstat -ano | findstr :3001
```

### Dashboard can't connect
1. Check agent is running: `pm2 list`
2. Test locally: `curl http://localhost:3001/?apiKey=YOUR_KEY`
3. Verify API key matches in both places
4. Check firewall isn't blocking the port

### node-pty fails to install
```bash
# Run as Administrator
npm install -g windows-build-tools

# Then reinstall
npm install
```

## Getting Help

1. Check [README.md](README.md) for full documentation
2. Review [agent/README_windows.md](agent/README_windows.md) for agent setup
3. See [dashboard/README.md](dashboard/README.md) for dashboard help
4. Check PM2 logs: `pm2 logs agent-api`

## Production Checklist

Before going to production:

- [ ] Change all API keys to strong random strings
- [ ] Set up Cloudflare Tunnel (or use HTTPS)
- [ ] Configure Windows Firewall
- [ ] Set up PM2 auto-start: `pm2 startup`
- [ ] Test server reboot - agents should auto-start
- [ ] Deploy dashboard behind authentication
- [ ] Never commit API keys to git
- [ ] Document your server configurations (securely!)

---

**You're all set! Start managing your servers like a pro! 🚀**
