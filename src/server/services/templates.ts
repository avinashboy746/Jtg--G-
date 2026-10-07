import path from "path";
import fs from "fs-extra";

export interface ServerInitData {
  id: string;
  name: string;
  serverType?: "minecraft" | "discord" | "website";
  subType?: string; // "node" | "python" | "static"
  port: number | string;
  version?: string;
  prefix?: string;
  startupFile?: string;
  botToken?: string;
}

export async function initializeServerFiles(server: ServerInitData): Promise<void> {
  const serverDir = path.join(process.cwd(), ".data", "servers", server.id);
  await fs.ensureDir(serverDir);

  const type = server.serverType || "minecraft";

  if (type === "discord") {
    const isPython = server.subType === "python" || server.version?.toLowerCase().includes("python");
    const token = server.botToken || "your_bot_token_here";
    const prefix = server.prefix || "!";

    if (isPython) {
      // Python Discord Bot
      const botPy = `# JTG Panel - Discord Bot (discord.py)
import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
PREFIX = os.getenv("PREFIX", "${prefix}")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix=PREFIX, intents=intents)

@bot.event
async def on_ready():
    print(f"[Bot Ready] Logged in as {bot.user.name} (ID: {bot.user.id})")
    await bot.change_presence(activity=discord.Game(name=f"{PREFIX}help | JTG Panel"))

@bot.command(name="ping")
async def ping(ctx):
    latency = round(bot.latency * 1000)
    await ctx.send(f"🏓 Pong! Latency: {latency}ms")

@bot.command(name="info")
async def info(ctx):
    await ctx.send(f"⚡ **{bot.user.name}** is hosted on **JTG Panel**\\nGuilds: {len(bot.guilds)}\\nLatency: {round(bot.latency * 1000)}ms")

if not TOKEN or TOKEN == "your_bot_token_here":
    print("[Bot Warning] No valid DISCORD_TOKEN in .env! Please update your token in the Bot Config tab.")
else:
    print("[Bot] Starting discord client...")
    bot.run(TOKEN)
`;

      const requirements = `discord.py>=2.3.2\npython-dotenv>=1.0.0\n`;
      const env = `DISCORD_TOKEN=${token}\nPREFIX=${prefix}\n`;
      const readme = `# Discord Bot (Python) - JTG Panel

## Quick Setup:
1. Go to https://discord.com/developers/applications
2. Create an Application, go to the **Bot** tab, and generate a Bot Token.
3. Enable **Message Content Intent** in Privileged Gateway Intents.
4. Put your Bot Token in the **Bot Config** tab or in \`.env\`.
5. Invite your bot with the OAuth2 URL Generator (\`bot\` scope).
6. Click **Start** to run your bot 24/7!
`;

      await fs.writeFile(path.join(serverDir, "bot.py"), botPy, "utf-8");
      await fs.writeFile(path.join(serverDir, "requirements.txt"), requirements, "utf-8");
      await fs.writeFile(path.join(serverDir, ".env"), env, "utf-8");
      await fs.writeFile(path.join(serverDir, "README.md"), readme, "utf-8");
    } else {
      // Node.js Discord Bot (discord.js v14)
      const indexJs = `// JTG Panel - Discord Bot (discord.js v14)
require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.PREFIX || '${prefix}';

console.log('[System] Initializing Discord bot client...');

if (!token || token === 'your_bot_token_here') {
  console.log('[Bot Warning] No valid DISCORD_TOKEN found in .env!');
  console.log('[Bot Notice] Open the Bot Config tab to set your bot token.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(\`[Bot Ready] Logged in as \${client.user.tag}!\`);
  client.user.setActivity(\`\${prefix}help | JTG Panel\`, { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ping') {
    const ping = Date.now() - message.createdTimestamp;
    await message.reply(\`🏓 Pong! Latency: \${ping}ms | API: \${Math.round(client.ws.ping)}ms\`);
  } else if (command === 'help') {
    await message.reply(\`🤖 **Available Commands:**\\n• \`\${prefix}ping\` - Check bot latency\\n• \`\${prefix}info\` - Bot server info\\n• \`\${prefix}help\` - Show help list\`);
  } else if (command === 'info') {
    await message.reply(\`⚡ **\${client.user.username}** hosted on **JTG Panel**\\nServers: \${client.guilds.cache.size}\\nPing: \${Math.round(client.ws.ping)}ms\`);
  }
});

if (token && token !== 'your_bot_token_here') {
  client.login(token).catch(err => {
    console.error('[Bot Error] Failed to login to Discord:', err.message);
  });
}
`;

      const pkgJson = JSON.stringify({
        name: server.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "jtg-discord-bot",
        version: "1.0.0",
        description: "Discord Bot hosted on JTG Panel",
        main: "index.js",
        scripts: {
          start: "node index.js"
        },
        dependencies: {
          "discord.js": "^14.15.0",
          "dotenv": "^16.4.5"
        }
      }, null, 2);

      const env = `DISCORD_TOKEN=${token}\nPREFIX=${prefix}\n`;
      const readme = `# Discord Bot (Node.js) - JTG Panel

## Quick Setup:
1. Go to https://discord.com/developers/applications
2. Create an Application, go to the **Bot** tab, and generate a Bot Token.
3. Enable **Message Content Intent** in Privileged Gateway Intents.
4. Put your Bot Token in the **Bot Config** tab or in \`.env\`.
5. Invite your bot with the OAuth2 URL Generator (\`bot\` scope).
6. Click **Start** to run your bot 24/7!
`;

      await fs.writeFile(path.join(serverDir, "index.js"), indexJs, "utf-8");
      await fs.writeFile(path.join(serverDir, "package.json"), pkgJson, "utf-8");
      await fs.writeFile(path.join(serverDir, ".env"), env, "utf-8");
      await fs.writeFile(path.join(serverDir, "README.md"), readme, "utf-8");
    }
  } else if (type === "website") {
    const isNode = server.subType === "node" || server.version?.toLowerCase().includes("node");

    if (isNode) {
      // Node.js Express Web Server
      const serverJs = `const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || ${server.port || 8080};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    platform: 'JTG Panel Web Host',
    name: '${server.name}',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`[Web] Server is running at http://localhost:\${PORT}\`);
});
`;

      const pkgJson = JSON.stringify({
        name: server.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "jtg-website",
        version: "1.0.0",
        description: "Website hosted on JTG Panel",
        main: "server.js",
        scripts: {
          start: "node server.js"
        },
        dependencies: {
          "express": "^4.19.2"
        }
      }, null, 2);

      await fs.ensureDir(path.join(serverDir, "public"));
      await fs.writeFile(path.join(serverDir, "server.js"), serverJs, "utf-8");
      await fs.writeFile(path.join(serverDir, "package.json"), pkgJson, "utf-8");

      const publicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${server.name} - JTG Web Host</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0c10; color: #fff; margin: 0; padding: 2rem; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1f2833; padding: 2.5rem; border-radius: 1rem; border: 1px solid #45a29e; max-width: 500px; text-align: center; }
    h1 { color: #66fcf1; margin-top: 0; }
    p { color: #c5c6c7; line-height: 1.6; }
    .btn { background: #45a29e; color: #0b0c10; font-weight: bold; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${server.name}</h1>
    <p>Powered by Node.js & Express on JTG Panel.</p>
    <button class="btn" onclick="fetchStatus()">Check API Status</button>
    <p id="res" style="font-family: monospace; font-size: 0.85rem; margin-top: 1rem;"></p>
  </div>
  <script>
    async function fetchStatus() {
      const r = await fetch('/api/status');
      const data = await r.json();
      document.getElementById('res').innerText = JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>
`;
      await fs.writeFile(path.join(serverDir, "public", "index.html"), publicHtml, "utf-8");
    } else {
      // Static HTML/CSS/JS Website
      const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${server.name} - Hosted on JTG</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="badge">JTG Web Hosting</div>
      <h1>${server.name}</h1>
      <p class="subtitle">Your web hosting instance is deployed and live on JTG Panel.</p>
    </header>
    
    <main class="card-grid">
      <div class="card">
        <h3>🚀 High Speed</h3>
        <p>Ultra fast responsive design with instant reloading.</p>
      </div>
      <div class="card">
        <h3>📁 File Manager</h3>
        <p>Edit HTML, CSS, JavaScript directly inside JTG Panel.</p>
      </div>
      <div class="card">
        <h3>🌐 Live Preview</h3>
        <p>Preview your live site in real-time right inside the panel.</p>
      </div>
    </main>

    <div class="action-box">
      <button id="counterBtn" class="btn">Interactive Demo: <span id="count">0</span> clicks</button>
    </div>

    <footer>
      <p>Hosted with ⚡ on JTG Panel &bull; <span id="time"></span></p>
    </footer>
  </div>
  <script src="app.js"></script>
</body>
</html>
`;

      const styleCss = `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: #09090b;
  color: #f4f4f5;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
}
.container { max-width: 800px; width: 100%; margin: 0 auto; text-align: center; }
.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 9999px;
  margin-bottom: 1rem;
}
h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #ffffff, #a1a1aa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle { color: #a1a1aa; font-size: 1.1rem; margin-bottom: 2.5rem; }
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
  text-align: left;
}
.card {
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: transform 0.2s, border-color 0.2s;
}
.card:hover { transform: translateY(-2px); border-color: rgba(99, 102, 241, 0.4); }
.card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; color: #fff; }
.card p { color: #71717a; font-size: 0.9rem; line-height: 1.5; }
.action-box { margin-bottom: 2rem; }
.btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.8rem 1.8rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.btn:hover { background: #4f46e5; }
.btn:active { transform: scale(0.98); }
footer { color: #52525b; font-size: 0.85rem; }
`;

      const appJs = `let count = 0;
const btn = document.getElementById("counterBtn");
const countSpan = document.getElementById("count");
const timeSpan = document.getElementById("time");

if (btn && countSpan) {
  btn.addEventListener("click", () => {
    count++;
    countSpan.textContent = count;
  });
}

if (timeSpan) {
  timeSpan.textContent = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
`;

      const readme = `# Website Hosting - JTG Panel

## Live Website Instructions:
- Edit \`index.html\`, \`style.css\`, and \`app.js\` directly using the File Manager.
- Use the **Web & Preview** tab to see your site live inside JTG Panel.
- To add images, upload them to the root folder and reference them as \`<img src="your-image.png">\`.
`;

      await fs.writeFile(path.join(serverDir, "index.html"), indexHtml, "utf-8");
      await fs.writeFile(path.join(serverDir, "style.css"), styleCss, "utf-8");
      await fs.writeFile(path.join(serverDir, "app.js"), appJs, "utf-8");
      await fs.writeFile(path.join(serverDir, "README.md"), readme, "utf-8");
    }
  } else {
    // Minecraft Server default initialization
    const props = `#Minecraft server properties
#JTG Panel initialized
motd=${server.name} hosted on JTG Panel
server-port=${server.port || 25565}
max-players=20
online-mode=false
pvp=true
difficulty=easy
gamemode=survival
enable-command-block=true
allow-flight=false
view-distance=10
`;
    await fs.writeFile(path.join(serverDir, "server.properties"), props, "utf-8");
    await fs.writeFile(path.join(serverDir, "eula.txt"), "eula=true\n", "utf-8");
  }
}
