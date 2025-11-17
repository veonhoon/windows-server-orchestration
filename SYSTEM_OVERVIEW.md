# System Overview - Multi-Server Orchestration

A visual and conceptual guide to understanding the complete system.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    YOU (System Administrator)                 │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Web Browser (Chrome/Firefox/Edge)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DASHBOARD (Next.js Web App)                  │
│  ┌────────────┬────────────┬────────────┬────────────┐      │
│  │  Control   │  Terminal  │    Logs    │   Config   │      │
│  │   Panel    │  (xterm)   │   Viewer   │   Editor   │      │
│  └────────────┴────────────┴────────────┴────────────┘      │
│                                                               │
│  🖥️ Server Selector:                                         │
│  [Server 1] [Server 2] [Server 3] [Server 4]                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
     REST + WebSocket       │        REST + WebSocket
     (HTTPS/WSS)           │         (HTTPS/WSS)
            │               │               │
    ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
    │   Server 1   │ │  Server 2  │ │  Server 3   │  ...
    │  Windows 10  │ │ Windows 11 │ │  Server 19  │
    │              │ │            │ │             │
    │ ┌──────────┐ │ │ ┌────────┐ │ │ ┌─────────┐│
    │ │  Agent   │ │ │ │ Agent  │ │ │ │  Agent  ││
    │ │   API    │ │ │ │  API   │ │ │ │   API   ││
    │ │(Node.js) │ │ │ │(Node.js│ │ │ │(Node.js)││
    │ └──────────┘ │ │ └────────┘ │ │ └─────────┘│
    │      │       │ │      │     │ │      │      │
    │   ┌──▼──┐    │ │   ┌──▼──┐  │ │   ┌──▼──┐   │
    │   │ PM2 │    │ │   │ PM2 │  │ │   │ PM2 │   │
    │   └──┬──┘    │ │   └──┬──┘  │ │   └──┬──┘   │
    │      │       │ │      │     │ │      │      │
    │   ┌──▼──┐    │ │   ┌──▼──┐  │ │   ┌──▼──┐   │
    │   │Your │    │ │   │Your │  │ │   │Your │   │
    │   │ App │    │ │   │ App │  │ │   │ App │   │
    │   └─────┘    │ │   └─────┘  │ │   └─────┘   │
    └──────────────┘ └────────────┘ └─────────────┘
```

## Data Flow

### 1. Command Execution
```
User clicks "Restart Program"
        │
        ▼
Dashboard sends POST to /restartProgram
        │
        ▼
Agent receives request + validates API key
        │
        ▼
Agent executes: pm2 restart server-program
        │
        ▼
PM2 restarts your application
        │
        ▼
Agent sends response back to dashboard
        │
        ▼
Dashboard shows success message
```

### 2. Real-Time Terminal
```
User opens Terminal tab
        │
        ▼
Dashboard creates WebSocket connection
        │
        ▼
Agent spawns PTY (node-pty)
        │
        ▼
User types command ──────────────► Agent writes to PTY
        │                                   │
        ▼                                   ▼
PTY executes ◄──────────────────── PTY outputs
        │
        ▼
Output sent to dashboard via WebSocket
        │
        ▼
xterm.js displays output
```

### 3. System Stats Monitoring
```
Dashboard connects via WebSocket
        │
        ▼
Agent starts stats collection loop
        │
        ▼
Every 2 seconds:
  ├─ Read CPU usage
  ├─ Read RAM usage
  └─ Read disk usage
        │
        ▼
Send stats to dashboard via WebSocket
        │
        ▼
Dashboard updates UI in real-time
```

## Component Interactions

### Agent Components
```
server.js
  ├─ Creates Express app
  ├─ Creates WebSocket server
  ├─ Loads configuration from config.json
  ├─ Defines REST API endpoints
  └─ Handles WebSocket messages
        │
        ├──► terminal.js
        │      ├─ Manages PTY sessions
        │      ├─ Handles terminal I/O
        │      └─ Manages WebSocket clients
        │
        ├──► shell.js
        │      ├─ Executes commands
        │      ├─ PM2 operations
        │      └─ Git operations
        │
        └──► stats.js
               ├─ Collects CPU stats
               ├─ Collects memory stats
               └─ Collects disk stats
```

### Dashboard Components
```
index.tsx (Main Page)
  ├─ ServerSelector
  │    └─ Shows list of servers
  │    └─ Handles server selection
  │
  ├─ Control Panel Tab
  │    ├─ StatsPanel
  │    │    └─ WebSocket connection
  │    │    └─ Real-time stat updates
  │    │
  │    ├─ PM2 Process List
  │    │    └─ Fetches from /pm2/list
  │    │
  │    └─ Action Buttons
  │         └─ Call API endpoints
  │
  ├─ Terminal Tab
  │    └─ TerminalView
  │         ├─ xterm.js instance
  │         ├─ WebSocket connection
  │         ├─ Handles input
  │         └─ Displays output
  │
  ├─ Logs Tab
  │    └─ Fetches from /logs
  │    └─ Displays PM2 logs
  │
  └─ Config Tab
       └─ Fetches from /config
       └─ Allows editing
       └─ Saves to /config
```

## Security Layers

```
┌─────────────────────────────────────────┐
│     Optional: Cloudflare Access         │  Authentication
│     Or OAuth, VPN, etc.                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Cloudflare Tunnel (Optional)        │  HTTPS/WSS
│     Or direct HTTPS                      │  Encryption
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Agent API Key Validation            │  API Key
│     X-API-Key header required            │  Authentication
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Windows Firewall                     │  Network
│     Only necessary ports open            │  Protection
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     PM2 Process Isolation               │  Process
│     Separate agent and app processes    │  Separation
└─────────────────────────────────────────┘
```

## Deployment Topology

### Option 1: Direct Connection (Development)
```
Dashboard ──► http://192.168.1.100:3001 ──► Server 1
          ├─► http://192.168.1.101:3001 ──► Server 2
          ├─► http://192.168.1.102:3001 ──► Server 3
          └─► http://192.168.1.103:3001 ──► Server 4
```

### Option 2: Cloudflare Tunnel (Production - Recommended)
```
Dashboard ──► https://server1.yourdomain.com ──┐
          ├─► https://server2.yourdomain.com ──┤
          ├─► https://server3.yourdomain.com ──┤ Cloudflare Network
          └─► https://server4.yourdomain.com ──┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
             Tunnel 1      Tunnel 2    Tunnel 3
                    │           │           │
              localhost:3001  localhost:3001  localhost:3001
                    │           │           │
                Server 1    Server 2    Server 3
```

## Technology Stack Breakdown

### Backend (Agent)
```
Node.js v16+
    │
    ├─ Express.js ─────────► REST API framework
    ├─ ws ─────────────────► WebSocket library
    ├─ node-pty ───────────► Terminal emulation (Windows ConPTY)
    ├─ systeminformation ──► System stats collection
    └─ PM2 ────────────────► Process management
```

### Frontend (Dashboard)
```
Next.js 14
    │
    ├─ React 18 ───────────► UI framework
    ├─ TypeScript ─────────► Type safety
    ├─ xterm.js ───────────► Terminal UI
    │   ├─ xterm-addon-fit
    │   └─ xterm-addon-web-links
    └─ styled-jsx ─────────► CSS-in-JS styling
```

### Infrastructure
```
PM2 ──────────────────────► Process management
Windows Services ─────────► Auto-start on boot
Cloudflare Tunnel ────────► Secure remote access
Windows Firewall ─────────► Network security
```

## Use Cases

### Use Case 1: Deploy Code Update
```
1. User clicks "Git Pull" on Server 1
2. Agent executes: git pull
3. User clicks "Restart Program"
4. Agent executes: pm2 restart server-program
5. New code is now running
```

### Use Case 2: Debug Issue
```
1. User opens Logs tab
2. Clicks "Program Logs"
3. Sees error in logs
4. Opens Terminal tab
5. Runs diagnostic commands
6. Identifies and fixes issue
```

### Use Case 3: Monitor Multiple Servers
```
1. Dashboard shows all 4 servers in sidebar
2. Stats update every 2 seconds for selected server
3. User switches between servers to compare
4. Identifies Server 3 has high CPU
5. Opens terminal to Server 3 to investigate
```

### Use Case 4: Emergency Restart
```
1. Server 2 is unresponsive
2. User selects Server 2
3. Clicks "Restart Program"
4. Program restarts immediately
5. Service restored
```

## File Organization Rationale

### Why separate agent/ and dashboard/?
- **Independent deployment**: Agent goes to servers, dashboard stays centralized
- **Different environments**: Agent runs on Windows servers, dashboard can run anywhere
- **Separate dependencies**: Each has its own node_modules
- **Version control**: Can version independently

### Why config.json instead of .env?
- **Windows compatibility**: Easier to edit on Windows
- **PM2 integration**: Can be read by PM2 ecosystem
- **Runtime updates**: Can be modified via dashboard
- **JSON structure**: Better for complex configuration

### Why PM2?
- **Process management**: Auto-restart on crashes
- **Logging**: Built-in log management
- **Monitoring**: Process metrics
- **Windows support**: Works well on Windows
- **Clustering**: Can run multiple instances
- **Startup**: Easy auto-start on boot

### Why xterm.js?
- **Full terminal emulation**: Supports colors, escape sequences
- **Mature library**: Battle-tested and maintained
- **Addons**: Fit, web links, search, etc.
- **Performance**: Handles large outputs well
- **Customizable**: Themes, fonts, etc.

## Scaling Considerations

### Current Design (4-10 servers)
```
One dashboard → Multiple agents
- Simple to manage
- Direct connections
- Manual server configuration
```

### Future Scale (10+ servers)
```
Potential enhancements:
├─ Database for server configs
├─ Server auto-discovery
├─ Load balancing
├─ Central logging (ELK stack)
├─ Metrics aggregation (Prometheus)
├─ Alert management (PagerDuty)
└─ User roles & permissions
```

## Process Lifecycle

### Agent Startup
```
1. Windows boots
2. PM2 service starts automatically
3. PM2 reads saved process list
4. PM2 starts agent-api
5. server.js loads config.json
6. Express server starts on port 3001
7. WebSocket server starts on same port
8. Agent is ready to receive connections
```

### Dashboard Startup
```
1. User runs: npm run dev (or npm start)
2. Next.js server starts
3. React app loads in browser
4. servers.ts configuration loaded
5. User selects a server
6. Dashboard connects to agent via REST
7. Dashboard shows stats, processes, etc.
8. User can interact with server
```

## Communication Patterns

### REST API (Request/Response)
```
Dashboard ─────► POST /restartProgram ─────► Agent
          ◄───── { success: true } ────────┘

Used for:
- Commands that complete quickly
- Configuration updates
- Log retrieval
- One-time operations
```

### WebSocket (Bidirectional Streaming)
```
Dashboard ◄────► /ws ◄────► Agent
              │
              ├─ Terminal I/O (continuous)
              ├─ System stats (every 2s)
              └─ Real-time events

Used for:
- Interactive terminal
- Live system stats
- Real-time updates
- Long-running operations
```

## Error Handling

### Network Failures
```
Dashboard loses connection
        │
        ▼
WebSocket: Automatic reconnect after 5s
REST API: Show error, allow retry
        │
        ▼
User sees "Disconnected" status
        │
        ▼
Connection restored
        │
        ▼
User sees "Connected" status
```

### Agent Crashes
```
Agent process crashes
        │
        ▼
PM2 detects crash
        │
        ▼
PM2 automatically restarts agent
        │
        ▼
Agent is back online within seconds
        │
        ▼
Dashboard reconnects automatically
```

## Performance Metrics

### Agent Performance
- Memory usage: ~50-100 MB
- CPU usage: <1% idle, <5% active
- Response time: <50ms local, <200ms remote
- WebSocket throughput: ~1 MB/s
- Concurrent connections: 10-50 per agent

### Dashboard Performance
- Load time: <2 seconds
- Bundle size: ~200 KB gzipped
- Memory usage: ~100-200 MB in browser
- Render time: <16ms (60 FPS)
- WebSocket latency: <50ms

## Troubleshooting Flow

```
Issue occurs
    │
    ├─ Dashboard shows error?
    │     Yes ─► Check browser console
    │     No ──► Check agent is running (pm2 list)
    │
    ├─ Can't connect?
    │     ├─ Test locally: curl http://localhost:3001
    │     ├─ Check firewall
    │     └─ Verify Cloudflare Tunnel
    │
    ├─ Terminal not working?
    │     ├─ Check node-pty installed
    │     ├─ View agent logs: pm2 logs agent-api
    │     └─ Check Windows version
    │
    └─ Stats not updating?
          ├─ Check WebSocket connection
          ├─ Check systeminformation package
          └─ Verify agent has permissions
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                  QUICK REFERENCE                         │
├─────────────────────────────────────────────────────────┤
│ View processes:        pm2 list                         │
│ View logs:             pm2 logs agent-api               │
│ Restart agent:         pm2 restart agent-api            │
│ Test agent locally:    curl http://localhost:3001       │
│ Check port:            netstat -ano | findstr :3001     │
│ Edit config:           notepad config.json              │
│ Save PM2 state:        pm2 save                         │
│ Dashboard dev:         npm run dev                      │
│ Dashboard build:       npm run build                    │
│ Generate API key:      node -e "console.log(require...  │
└─────────────────────────────────────────────────────────┘
```

---

**This overview gives you the mental model to understand, deploy, and troubleshoot the entire system! 🧠**
