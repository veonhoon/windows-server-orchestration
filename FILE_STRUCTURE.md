# Complete File Structure

This document shows every file in the multi-server orchestration system.

```
control board/
│
├── README.md                           ⭐ Main documentation - START HERE
├── QUICKSTART.md                       🚀 30-minute setup guide
├── LICENSE                             📄 MIT License
├── .gitignore                          🔒 Git ignore rules
├── FILE_STRUCTURE.md                   📋 This file
│
├── agent/                              🤖 Server Agent (deploy to each Windows server)
│   ├── server.js                       ├─ Main Express API server
│   ├── terminal.js                     ├─ Terminal manager (PTY + WebSocket)
│   ├── shell.js                        ├─ Command execution wrapper
│   ├── stats.js                        ├─ System statistics collector
│   ├── config.json                     ├─ Server-specific configuration
│   ├── pm2.json                        ├─ PM2 ecosystem configuration
│   ├── package.json                    ├─ Node.js dependencies
│   ├── README_windows.md               ├─ Windows installation guide
│   └── .gitignore                      └─ Git ignore for agent
│
├── dashboard/                          💻 Control Dashboard (Next.js web app)
│   ├── pages/
│   │   ├── index.tsx                   ├─ Main dashboard UI (all tabs)
│   │   ├── _app.tsx                    ├─ Next.js app wrapper
│   │   └── _document.tsx               └─ HTML document structure
│   ├── components/
│   │   ├── ServerSelector.tsx          ├─ Server list sidebar
│   │   ├── StatsPanel.tsx              ├─ Real-time stats display (CPU/RAM/Disk)
│   │   └── TerminalView.tsx            └─ Interactive terminal (xterm.js)
│   ├── lib/
│   │   ├── servers.ts                  ├─ Server configuration (URLs, API keys)
│   │   └── fetcher.ts                  └─ API client functions
│   ├── public/
│   │   └── .gitkeep                    └─ Public assets directory
│   ├── package.json                    ├─ Node.js dependencies
│   ├── tsconfig.json                   ├─ TypeScript configuration
│   ├── next.config.js                  ├─ Next.js configuration
│   ├── README.md                       ├─ Dashboard documentation
│   └── .gitignore                      └─ Git ignore for dashboard
│
└── build/                              🔧 Build Scripts & Deployment Tools
    ├── build-agent.bat                 ├─ Windows batch script to package agent
    ├── install-agent-instructions.txt  ├─ Complete deployment guide
    ├── DEPLOYMENT_CHECKLIST.md         ├─ Track deployment progress
    └── WINDOWS_COMMANDS_REFERENCE.md   └─ Quick command reference

```

## File Descriptions

### Root Level

| File | Purpose | Size |
|------|---------|------|
| `README.md` | Complete system documentation | ~15 KB |
| `QUICKSTART.md` | 30-minute setup guide | ~5 KB |
| `LICENSE` | MIT License | ~1 KB |
| `.gitignore` | Git ignore patterns | ~1 KB |
| `FILE_STRUCTURE.md` | This file | ~10 KB |

### Agent (Server-Side)

| File | Purpose | Lines | Key Features |
|------|---------|-------|-------------|
| `server.js` | Main API server | ~400 | Express, WebSocket, REST endpoints |
| `terminal.js` | Terminal manager | ~200 | node-pty, PTY sessions, client management |
| `shell.js` | Command execution | ~250 | PM2 control, git operations, exec wrapper |
| `stats.js` | System stats | ~100 | CPU, RAM, disk monitoring |
| `config.json` | Configuration | ~10 | Per-server settings |
| `pm2.json` | PM2 config | ~20 | Process management |
| `package.json` | Dependencies | ~25 | Express, ws, node-pty, systeminformation |
| `README_windows.md` | Windows setup | ~500+ | Complete installation guide |

**Dependencies:**
- express: ^4.18.2
- cors: ^2.8.5
- ws: ^8.14.2
- node-pty: ^1.0.0
- systeminformation: ^5.21.20
- pm2: ^5.3.0

**Total Lines of Code:** ~1,000 (agent)

### Dashboard (Web Interface)

| File | Purpose | Lines | Key Features |
|------|---------|-------|-------------|
| `pages/index.tsx` | Main dashboard | ~700 | All UI, tabs, controls |
| `pages/_app.tsx` | App wrapper | ~50 | Global styles |
| `pages/_document.tsx` | HTML document | ~15 | Next.js document |
| `components/ServerSelector.tsx` | Server list | ~100 | Server switching UI |
| `components/StatsPanel.tsx` | Stats display | ~250 | Real-time monitoring, WebSocket |
| `components/TerminalView.tsx` | Terminal UI | ~250 | xterm.js integration, WebSocket |
| `lib/servers.ts` | Server config | ~50 | Server definitions |
| `lib/fetcher.ts` | API client | ~200 | REST API functions |
| `package.json` | Dependencies | ~30 | Next.js, React, xterm.js |
| `tsconfig.json` | TypeScript config | ~25 | TS settings |
| `next.config.js` | Next.js config | ~15 | Build configuration |
| `README.md` | Dashboard docs | ~400+ | Setup & deployment |

**Dependencies:**
- next: 14.0.4
- react: ^18.2.0
- react-dom: ^18.2.0
- typescript: ^5.3.3
- xterm: ^5.3.0
- xterm-addon-fit: ^0.8.0
- xterm-addon-web-links: ^0.9.0

**Total Lines of Code:** ~1,600 (dashboard)

### Build Tools

| File | Purpose | Type |
|------|---------|------|
| `build-agent.bat` | Package agent for deployment | Windows batch script |
| `install-agent-instructions.txt` | Complete deployment guide | Text documentation |
| `DEPLOYMENT_CHECKLIST.md` | Track deployment progress | Markdown checklist |
| `WINDOWS_COMMANDS_REFERENCE.md` | Command reference | Markdown documentation |

## Total Project Stats

- **Total Files**: 30+
- **Total Lines of Code**: ~2,600+
- **Total Documentation**: ~2,000+ lines
- **Languages**: TypeScript, JavaScript, Markdown, Batch
- **Frameworks**: Next.js, Express.js
- **Key Libraries**: xterm.js, node-pty, ws, systeminformation

## File Flow

### During Development

```
1. Edit agent/*.js                  → Agent functionality
2. Edit dashboard/pages/*.tsx       → Dashboard UI
3. Edit dashboard/components/*.tsx  → React components
4. Edit dashboard/lib/*.ts          → API & config
5. Edit build/*.bat                 → Build scripts
```

### During Deployment

```
1. Run build/build-agent.bat        → Creates agent package
2. Extract on server                → Install agent files
3. Edit agent/config.json           → Configure for server
4. Run agent/install.bat            → Install dependencies
5. pm2 start agent/pm2.json         → Start agent
6. Edit dashboard/lib/servers.ts    → Add server to dashboard
7. npm run dev in dashboard/        → Test connection
8. npm run build in dashboard/      → Build for production
9. Deploy dashboard                 → Production deployment
```

## Key Configuration Files

### Agent Configuration
```
agent/config.json
├─ startupCommand    → How to start your program
├─ programCwd        → Where your program is
├─ programName       → PM2 process name
├─ agentPort         → API port (default 3001)
└─ apiKey           → Authentication key (MUST BE UNIQUE!)
```

### Dashboard Configuration
```
dashboard/lib/servers.ts
└─ servers[]
   ├─ id            → Unique identifier
   ├─ name          → Display name
   ├─ url           → Agent URL (http/https)
   ├─ apiKey        → Must match agent config
   └─ color         → UI color
```

## Size on Disk

**Before npm install:**
- Agent: ~50 KB
- Dashboard: ~100 KB
- Build: ~50 KB
- Docs: ~100 KB
- **Total**: ~300 KB

**After npm install:**
- Agent: ~150 MB (with node_modules)
- Dashboard: ~350 MB (with node_modules)
- **Total**: ~500 MB

**Production Build:**
- Agent (zipped): ~100 MB
- Dashboard (built): ~5 MB
- **Total deployed**: ~105 MB per server setup

## API Endpoints (Agent)

The agent exposes these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/stats` | GET | System statistics |
| `/run` | POST | Execute command |
| `/restartProgram` | POST | Restart main program |
| `/startProgram` | POST | Start main program |
| `/stopProgram` | POST | Stop main program |
| `/restartAgent` | POST | Restart agent |
| `/logs` | GET | Get PM2 logs |
| `/pm2/list` | GET | List PM2 processes |
| `/git/pull` | POST | Git pull |
| `/git/status` | GET | Git status |
| `/config` | GET | Get config |
| `/config` | POST | Update config |
| `/terminal/create` | POST | Create terminal |
| `/terminal/list` | GET | List terminals |
| `/terminal/:id` | DELETE | Kill terminal |
| `/ws` | WebSocket | Terminal & stats |

## Component Tree (Dashboard)

```
App (_app.tsx)
└── Page (index.tsx)
    ├── Header
    │   └── Server name display
    ├── Sidebar
    │   └── ServerSelector
    │       └── Server buttons (1-4+)
    └── Main Content
        ├── Tabs (Control/Terminal/Logs/Config)
        └── Tab Content
            ├── Control Panel Tab
            │   ├── StatsPanel (real-time stats)
            │   ├── PM2 Process List
            │   ├── Quick Actions (buttons)
            │   └── Command Input
            ├── Terminal Tab
            │   └── TerminalView (xterm.js)
            ├── Logs Tab
            │   └── Log viewer
            └── Config Tab
                └── Config editor
```

## Installation Order

1. ✅ Node.js (all machines)
2. ✅ PM2 globally (all servers)
3. ✅ Windows Build Tools (all servers)
4. ✅ Build agent package (dev machine)
5. ✅ Deploy agent to Server 1
6. ✅ Deploy agent to Server 2
7. ✅ Deploy agent to Server 3
8. ✅ Deploy agent to Server 4+
9. ✅ Configure dashboard
10. ✅ Test dashboard locally
11. ✅ Deploy dashboard to production

## Security Files

**Never commit these files:**
- `agent/config.json` (contains API key)
- `dashboard/.env.local` (contains API keys)
- Any files with `.local` extension
- `secrets/` directory
- `*.key`, `*.pem` files

**Safe to commit:**
- `agent/config.json` (with placeholder values)
- All source code files
- Documentation
- Build scripts

## Backup These Files

Before updates, backup:
- `agent/config.json` on each server
- `dashboard/lib/servers.ts`
- PM2 configuration: `pm2 save`
- Any custom modifications

## Documentation Hierarchy

```
README.md (main)                    ⭐ Start here
├── QUICKSTART.md                   → Fast setup
├── agent/README_windows.md         → Agent details
├── dashboard/README.md             → Dashboard details
├── build/install-agent-instructions.txt  → Full deployment
├── build/DEPLOYMENT_CHECKLIST.md   → Track progress
└── build/WINDOWS_COMMANDS_REFERENCE.md  → Command help
```

---

**Everything you need is here! 🎉**

Ready to deploy? Start with [QUICKSTART.md](QUICKSTART.md)!
