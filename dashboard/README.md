# Server Orchestration Dashboard

The central control dashboard for managing multiple Windows servers remotely.

## Features

- **Multi-Server Management**: Control 4+ Windows servers from one interface
- **Real-Time Terminal**: Interactive terminal via WebSockets using xterm.js
- **System Monitoring**: Live CPU, RAM, and disk statistics
- **PM2 Process Control**: Start, stop, restart your programs
- **Command Execution**: Run any shell command remotely
- **Log Viewing**: View PM2 logs for agent and main programs
- **Git Integration**: Pull code updates with one click
- **Configuration Management**: Edit server settings remotely
- **Agent Control**: Restart the agent itself

## Prerequisites

- Node.js v16 or higher
- npm or yarn

## Installation

1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your servers:

   Edit `lib/servers.ts` with your server details:

   ```typescript
   export const servers: ServerConfig[] = [
     {
       id: 'server-1',
       name: 'Server 1 (US-East)',
       url: 'https://server1-agent.yourdomain.com',
       apiKey: 'super-secret-key-12345-server-1',
       color: '#3b82f6'
     },
     // Add more servers...
   ];
   ```

   **Important**: Make sure the URLs match your Cloudflare Tunnel URLs or server IPs, and API keys match those in your agent `config.json` files.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dashboard will hot-reload as you make changes.

## Production Build

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

Follow the prompts to deploy.

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t server-dashboard .
docker run -p 3000:3000 server-dashboard
```

### Option 3: PM2

Build the app:
```bash
npm run build
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'dashboard',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Option 4: Windows Service with pm2-windows-service

1. Install pm2-windows-service:
   ```bash
   npm install -g pm2-windows-service
   pm2-service-install
   ```

2. Build and start:
   ```bash
   npm run build
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Configuration

### Server Configuration (`lib/servers.ts`)

Each server needs:

- `id`: Unique identifier
- `name`: Display name
- `url`: Agent API URL (Cloudflare Tunnel or direct IP)
- `apiKey`: Must match the agent's API key
- `color`: Optional color for UI differentiation

### Environment Variables

You can use environment variables instead of hardcoding values:

Create `.env.local`:
```env
NEXT_PUBLIC_SERVER1_URL=https://server1.yourdomain.com
NEXT_PUBLIC_SERVER1_KEY=your-api-key-1
NEXT_PUBLIC_SERVER2_URL=https://server2.yourdomain.com
NEXT_PUBLIC_SERVER2_KEY=your-api-key-2
```

Then modify `lib/servers.ts`:
```typescript
export const servers: ServerConfig[] = [
  {
    id: 'server-1',
    name: 'Server 1',
    url: process.env.NEXT_PUBLIC_SERVER1_URL || '',
    apiKey: process.env.NEXT_PUBLIC_SERVER1_KEY || '',
  },
];
```

## Usage

### Control Panel Tab

- View system statistics in real-time
- See all PM2 processes and their status
- Quick actions:
  - Restart Program: Restart your main program via PM2
  - Start/Stop Program: Control program state
  - Restart Agent: Restart the agent API
  - Git Pull: Pull latest code changes
- Run custom commands

### Terminal Tab

- Full interactive terminal with xterm.js
- Run commands as if you were SSH'd into the server
- Supports colors, key bindings, and interactive programs
- Auto-reconnects if connection is lost

### Logs Tab

- View PM2 logs for any process
- Refresh to get latest logs
- Separate buttons for agent and program logs

### Config Tab

- View current server configuration
- Edit configuration remotely
- Changes are saved to the agent's `config.json`

## Troubleshooting

### Can't connect to server

1. Verify the agent is running: `pm2 list` on the server
2. Check the agent URL in `lib/servers.ts`
3. Verify API key matches
4. Check Cloudflare Tunnel is active
5. Check browser console for errors

### Terminal not working

1. Ensure xterm.js CSS is loading (check browser DevTools)
2. Verify WebSocket connection (check browser Network tab)
3. Try refreshing the page
4. Check agent logs: `pm2 logs agent-api`

### Stats not updating

1. Check WebSocket connection in browser DevTools
2. Verify agent is running
3. Check for firewall issues

### CORS errors

The agent has CORS enabled by default. If you still see CORS errors:

1. Check the agent's CORS configuration in `server.js`
2. Ensure you're using HTTPS (required for WebSockets over Cloudflare)

## Security

**Important Security Notes:**

1. **Never commit API keys to git** - Use environment variables
2. **Use HTTPS only** - Especially for production
3. **Strong API keys** - Use long random strings
4. **Cloudflare Tunnel** - Recommended over direct IP exposure
5. **Different keys per server** - Don't reuse API keys
6. **Access control** - Deploy dashboard behind authentication (Cloudflare Access, OAuth, etc.)

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Terminal**: xterm.js + xterm-addon-fit
- **Styling**: CSS-in-JS (styled-jsx)
- **Communication**: REST API + WebSockets

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (some terminal features may vary)

Modern browsers with WebSocket and ES6+ support required.

## License

MIT
