# 🖥️ Multi-Server Orchestration System

A complete, production-ready system for remotely controlling and monitoring multiple Windows servers from a centralized dashboard.

![System Architecture](https://img.shields.io/badge/Architecture-Agent%20%2B%20Dashboard-blue)
![Platform](https://img.shields.io/badge/Platform-Windows-brightgreen)
![Node](https://img.shields.io/badge/Node.js-v16%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Overview

This orchestration system allows you to control 4+ Windows servers from a single web dashboard. Each server runs a lightweight agent API that the dashboard communicates with via REST and WebSockets.

### Key Features

✨ **Complete Remote Control**
- Execute shell commands on any server
- Interactive real-time terminal via WebSockets
- Restart programs with PM2
- Update code with git pull
- Edit server configurations remotely

📊 **Real-Time Monitoring**
- Live CPU, RAM, and disk usage
- PM2 process status and metrics
- Streaming logs from agents and programs
- WebSocket-based live updates

📱 **Phone Monitoring (NEW!)**
- Track Android devices via ADB on each server
- Monitor online/offline/unauthorized status
- Device information (model, Android version, battery)
- Remote device reboot
- Easy add/edit/remove management

🔒 **Security Built-In**
- API key authentication
- Cloudflare Tunnel support
- HTTPS/WSS connections
- Per-server unique credentials

⚡ **Production Ready**
- PM2 process management
- Auto-restart on crashes
- Windows service integration
- Comprehensive error handling

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Dashboard (Next.js)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────┐│
│  │ Control  │  │ Terminal │  │   Logs   │  │  Phones  │  │Cfg ││
│  │  Panel   │  │  (xterm) │  │  Viewer  │  │ Monitor  │  │    ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
         REST API + WebSockets (HTTPS/WSS)
                            │
    ┌───────────┬───────────┴───────────┬───────────┐
    │           │                       │           │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│Server 1│  │Server 2│  │Server 3│  │Server 4│
│        │  │        │  │        │  │        │
│ Agent  │  │ Agent  │  │ Agent  │  │ Agent  │
│  API   │  │  API   │  │  API   │  │  API   │
│        │  │        │  │        │  │        │
│ ┌────┐ │  │ ┌────┐ │  │ ┌────┐ │  │ ┌────┐ │
│ │PM2 │ │  │ │PM2 │ │  │ │PM2 │ │  │ │PM2 │ │
│ └────┘ │  │ └────┘ │  │ └────┘ │  │ └────┘ │
│        │  │        │  │        │  │        │
│ Your   │  │ Your   │  │ Your   │  │ Your   │
│Program │  │Program │  │Program │  │Program │
└────────┘  └────────┘  └────────┘  └────────┘
```

## 📦 Project Structure

```
control board/
│
├── agent/                      # Server agent (deployed to each Windows server)
│   ├── server.js              # Main Express API server
│   ├── terminal.js            # Terminal manager (PTY + WebSocket)
│   ├── shell.js               # Command execution wrapper
│   ├── stats.js               # System statistics collector
│   ├── adb-monitor.js         # Phone/ADB monitoring (NEW!)
│   ├── config.json            # Per-server configuration
│   ├── phones.json            # Phone configurations (NEW!)
│   ├── pm2.json               # PM2 ecosystem file
│   ├── package.json           # Node.js dependencies
│   └── README_windows.md      # Windows setup instructions
│
├── dashboard/                  # Central control dashboard (Next.js)
│   ├── pages/
│   │   ├── index.tsx          # Main dashboard UI
│   │   ├── _app.tsx           # Next.js app wrapper
│   │   └── _document.tsx      # HTML document
│   ├── components/
│   │   ├── ServerSelector.tsx # Server list sidebar
│   │   ├── StatsPanel.tsx     # Real-time stats display
│   │   ├── TerminalView.tsx   # Interactive terminal (xterm.js)
│   │   └── PhoneMonitor.tsx   # Phone monitoring UI (NEW!)
│   ├── lib/
│   │   ├── servers.ts         # Server configuration
│   │   └── fetcher.ts         # API client functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── README.md              # Dashboard documentation
│
├── build/                      # Build scripts and deployment tools
│   ├── build-agent.bat        # Windows batch script to package agent
│   ├── install-agent-instructions.txt
│   └── DEPLOYMENT_CHECKLIST.md
│
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Build the Agent Package

On your development machine:

```bash
cd "control board\build"
build-agent.bat
```

This creates a deployable agent package in `build/output/`.

### 2. Deploy Agent to Each Server

On each Windows server:

1. Extract the agent package
2. Edit `config.json` with server-specific settings
3. Run `install.bat` as Administrator
4. Start with `pm2 start pm2.json`
5. Save with `pm2 save`
6. Configure auto-start: `pm2 startup`

**Example config.json:**
```json
{
  "startupCommand": "npm run start",
  "programCwd": "C:\\Projects\\MyApp\\server1",
  "programName": "server-program-1",
  "agentPort": 3001,
  "apiKey": "unique-secret-key-for-this-server"
}
```

### 3. Configure Dashboard

Update `dashboard/lib/servers.ts`:

```typescript
export const servers: ServerConfig[] = [
  {
    id: 'server-1',
    name: 'Server 1 (US-East)',
    url: 'https://server1-agent.yourdomain.com',
    apiKey: 'unique-secret-key-for-this-server',
    color: '#3b82f6'
  },
  // Add more servers...
];
```

### 4. Run Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Visit http://localhost:3000

### 5. Deploy Dashboard to Production

```bash
npm run build
npm start
```

Or deploy to Vercel, Docker, PM2, etc. (see [dashboard/README.md](dashboard/README.md))

## 📚 Documentation

### Detailed Guides

- **[Agent Setup](agent/README_windows.md)** - Complete Windows installation guide
- **[Dashboard Setup](dashboard/README.md)** - Dashboard configuration and deployment
- **[Phone Monitoring](PHONE_MONITORING.md)** - **NEW!** Android device monitoring via ADB
- **[Installation Guide](build/install-agent-instructions.txt)** - Step-by-step deployment instructions
- **[Deployment Checklist](build/DEPLOYMENT_CHECKLIST.md)** - Track your deployment progress

### API Endpoints

All agent endpoints require `X-API-Key` header or `?apiKey=` parameter:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/stats` | GET | System statistics (CPU, RAM, disk) |
| `/run` | POST | Execute shell command |
| `/restartProgram` | POST | Restart main program via PM2 |
| `/startProgram` | POST | Start main program |
| `/stopProgram` | POST | Stop main program |
| `/restartAgent` | POST | Restart the agent itself |
| `/logs` | GET | Get PM2 logs |
| `/pm2/list` | GET | List all PM2 processes |
| `/git/pull` | POST | Execute git pull |
| `/git/status` | GET | Get git status |
| `/config` | GET | Get server configuration |
| `/config` | POST | Update server configuration |
| `/terminal/create` | POST | Create terminal session |
| `/terminal/list` | GET | List terminal sessions |
| `/terminal/:id` | DELETE | Kill terminal session |
| `/phones/status` | GET | **NEW!** Get phone monitoring status |
| `/phones` | GET | **NEW!** Get all configured phones |
| `/phones` | POST | **NEW!** Add a new phone |
| `/phones/:serial` | PUT | **NEW!** Update phone configuration |
| `/phones/:serial` | DELETE | **NEW!** Remove a phone |
| `/phones/:serial/reboot` | POST | **NEW!** Reboot a phone |
| `/phones/adb/check` | GET | **NEW!** Check ADB availability |
| `/ws` | WebSocket | Terminal + stats + phone streaming |

### WebSocket Messages

**Client → Server:**
```json
{"type": "terminal.create", "cwd": "C:\\path"}
{"type": "terminal.attach", "terminalId": "term-1"}
{"type": "terminal.input", "data": "command\r"}
{"type": "terminal.resize", "cols": 80, "rows": 30}
{"type": "stats.start", "interval": 2000}
{"type": "stats.stop"}
{"type": "phones.start"}
{"type": "phones.stop"}
```

**Server → Client:**
```json
{"type": "terminal.created", "terminal": {...}}
{"type": "output", "data": "..."}
{"type": "stats", "data": {...}}
{"type": "phones.status", "data": {...}}
{"type": "error", "message": "..."}
```

## 🔧 Configuration

### Agent Configuration

Each agent has a `config.json` file:

```json
{
  "startupCommand": "npm run start",
  "programCwd": "C:\\Projects\\MyApp",
  "programName": "server-program",
  "agentPort": 3001,
  "apiKey": "your-secret-key"
}
```

- **startupCommand**: Command to start your main program
- **programCwd**: Working directory for your program
- **programName**: PM2 process name
- **agentPort**: Port for agent API (default: 3001)
- **apiKey**: Authentication key (MUST be unique per server)

### Dashboard Configuration

Configure servers in `dashboard/lib/servers.ts`:

```typescript
export const servers: ServerConfig[] = [
  {
    id: 'server-1',              // Unique ID
    name: 'Server 1 (US-East)',  // Display name
    url: 'https://...',          // Agent URL
    apiKey: '...',               // Must match agent
    color: '#3b82f6'             // UI color
  }
];
```

## 🔐 Security

### Best Practices

1. **Unique API Keys**: Generate different keys for each server
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use Cloudflare Tunnel**: Don't expose ports directly
   - Secure HTTPS/WSS connections
   - No open ports on servers
   - Free SSL certificates

3. **Strong Authentication**: Deploy dashboard behind auth
   - Cloudflare Access
   - OAuth (Auth0, Google, etc.)
   - VPN

4. **Environment Variables**: Never commit API keys
   ```bash
   # .env.local
   NEXT_PUBLIC_SERVER1_KEY=...
   ```

5. **Regular Updates**: Keep dependencies updated
   ```bash
   npm audit
   npm update
   ```

## 🛠️ Tech Stack

### Agent
- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Process Manager**: PM2
- **Terminal**: node-pty (Windows ConPTY)
- **WebSocket**: ws
- **System Info**: systeminformation

### Dashboard
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Terminal UI**: xterm.js + addons
- **Styling**: CSS-in-JS (styled-jsx)
- **Communication**: fetch API + WebSocket

## 📋 Requirements

### Server Requirements
- Windows 10/Server 2016 or newer
- Node.js v16 or higher
- PM2 installed globally
- Windows Build Tools (for node-pty)
- Git (optional, for git pull)

### Dashboard Requirements
- Node.js v16 or higher
- Modern web browser with WebSocket support

## 🐛 Troubleshooting

### Agent won't start
```bash
# Check logs
pm2 logs agent-api

# Verify Node.js version
node --version

# Check port availability
netstat -ano | findstr :3001

# Validate config.json
node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
```

### Dashboard can't connect
1. Verify agent is running: `pm2 list`
2. Test agent locally: `curl http://localhost:3001/?apiKey=...`
3. Check API key matches in both places
4. Verify Cloudflare Tunnel is running
5. Check browser console for errors

### Terminal not working
1. Ensure node-pty installed: `npm list node-pty`
2. Check Windows version (need 1809+)
3. View agent logs: `pm2 logs agent-api`
4. Try using PowerShell: edit `terminal.js` shell variable

### PM2 doesn't start on boot
```bash
# Re-run startup configuration
pm2 unstartup
pm2 startup

# Execute the command shown
# Then save
pm2 save

# Test by restarting Windows
shutdown /r /t 0
```

See detailed troubleshooting in [agent/README_windows.md](agent/README_windows.md)

## 🚦 Common Operations

### View all processes
```bash
pm2 list
```

### View logs
```bash
pm2 logs agent-api
pm2 logs server-program
```

### Restart services
```bash
pm2 restart agent-api
pm2 restart server-program
```

### Update agent code
```bash
pm2 stop agent-api
# Replace files
npm install  # if package.json changed
pm2 restart agent-api
```

### Monitor in real-time
```bash
pm2 monit
```

## 📈 Performance

- **Agent Memory**: ~50-100 MB per agent
- **Dashboard Bundle**: ~200 KB (gzipped)
- **WebSocket Overhead**: ~1-2 KB/s per connection
- **Stats Update Interval**: 2 seconds (configurable)
- **Terminal Latency**: <50ms on good connections

## 🤝 Contributing

This is a complete, ready-to-use system. Feel free to:

- Customize for your specific needs
- Add additional features
- Improve security measures
- Enhance the UI/UX
- Add monitoring/alerting

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [Next.js](https://nextjs.org/) - React framework
- [PM2](https://pm2.keymetrics.io/) - Process manager
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [node-pty](https://github.com/microsoft/node-pty) - Pseudoterminal
- [systeminformation](https://github.com/sebhildebrandt/systeminformation) - System stats

## 📞 Support

For issues and questions:

1. Check the troubleshooting guides
2. Review the detailed documentation
3. Check PM2 logs: `pm2 logs`
4. Verify configuration files
5. Test connectivity step by step

## 🎯 Roadmap

Potential future enhancements:

- [ ] Multi-user authentication
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Email/Slack alerts
- [ ] Metrics dashboard (Grafana)
- [ ] Database-backed configuration
- [ ] File upload/download
- [ ] Scheduled tasks/cron jobs
- [ ] Docker container management
- [ ] Backup/restore functionality

---

**Made with ❤️ for Windows Server Management**

*Ready to deploy. Ready to scale. Ready for production.*
