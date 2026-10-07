import Docker from "dockerode";
import fs from "fs-extra";
import path from "path";
import { io } from "../../../server.js"; // Import socket for logs
import { initializeServerFiles } from "./templates.js";

export const isSandbox = !fs.existsSync("/var/run/docker.sock") && process.platform !== "win32";

export const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

// Mock state and metadata for sandbox demo
const mockState: Record<string, boolean> = {};
const mockServerData: Record<string, any> = {};
const mockLogsStore: Record<string, string[]> = {};

export const getPaperVersions = async () => {
  return [
    "1.21.11", "1.21.4", "1.21.3", "1.21.2", "1.21.1", "1.21", 
    "1.20.6", "1.20.4", "1.20.2", "1.20.1", "1.20", 
    "1.19.4", "1.19.3", "1.19.2", "1.19.1", "1.19", 
    "1.18.2", "1.18.1", "1.17.1", "1.16.5", "1.15.2", 
    "1.14.4", "1.13.2", "1.12.2", "1.11.2", "1.10.2", 
    "1.9.4", "1.8.8"
  ];
};

const DOCKER_IMAGE_MINECRAFT = "itzg/minecraft-server";

export const createServerContainer = async (serverData: any) => {
  const serverDir = path.join(process.cwd(), ".data", "servers", serverData.id);
  await fs.ensureDir(serverDir);

  // Initialize initial files (bot templates, website templates, or minecraft configs)
  await initializeServerFiles(serverData);

  if (isSandbox) {
    mockState[serverData.id] = false;
    mockServerData[serverData.id] = serverData;
    mockLogsStore[serverData.id] = [`[System] Container created for ${serverData.name} (${serverData.serverType || 'minecraft'}).\r\n`];
    return "mock-container-id-" + serverData.id;
  }

  const serverType = serverData.serverType || "minecraft";

  if (serverType === "discord") {
    const isPython = serverData.subType === "python" || serverData.version?.toLowerCase().includes("python");
    const image = isPython ? "python:3.11-slim" : "node:20-alpine";
    const startupCmd = isPython
      ? ["python", serverData.startupFile || "bot.py"]
      : ["node", serverData.startupFile || "index.js"];

    const container = await docker.createContainer({
      Image: image,
      name: `jtg-server-${serverData.id}`,
      Tty: true,
      OpenStdin: true,
      WorkingDir: "/app",
      Cmd: startupCmd,
      HostConfig: {
        Binds: [`${serverDir}:/app`]
      }
    });
    return container.id;
  } else if (serverType === "website") {
    const isNode = serverData.subType === "node" || serverData.version?.toLowerCase().includes("node");
    const image = isNode ? "node:20-alpine" : "caddy:2-alpine";
    const startupCmd = isNode
      ? ["node", "server.js"]
      : ["caddy", "file-server", "--listen", `:${serverData.port}`, "--root", "/data"];

    const container = await docker.createContainer({
      Image: image,
      name: `jtg-server-${serverData.id}`,
      Tty: true,
      OpenStdin: true,
      WorkingDir: isNode ? "/app" : "/data",
      Cmd: startupCmd,
      ExposedPorts: {
        [`${serverData.port}/tcp`]: {}
      },
      HostConfig: {
        PortBindings: {
          [`${serverData.port}/tcp`]: [{ HostPort: `${serverData.port}` }]
        },
        Binds: [isNode ? `${serverDir}:/app` : `${serverDir}:/data`]
      }
    });
    return container.id;
  }

  // Default: Minecraft Paper Server
  // Pull image if not exists
  console.log(`Ensuring ${DOCKER_IMAGE_MINECRAFT} is pulled...`);
  await new Promise((resolve, reject) => {
    docker.pull(DOCKER_IMAGE_MINECRAFT, (err: any, stream: any) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, onFinished, onProgress);
      function onFinished(err: any, output: any) {
        if (err) return reject(err);
        resolve(output);
      }
      function onProgress(event: any) {}
    });
  });

  const container = await docker.createContainer({
    Image: DOCKER_IMAGE_MINECRAFT,
    name: `jtg-server-${serverData.id}`,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    Env: [
      `EULA=TRUE`,
      `TYPE=PAPER`,
      `VERSION=${serverData.version || "1.21.1"}`,
      `MEMORY=${serverData.ram}G`,
      `INIT_MEMORY=128M`,
      `SERVER_PORT=${serverData.port}`,
      `ENABLE_RCON=true`,
      `RCON_PASSWORD=admin`,
      `JVM_OPTS=-DPaper.IgnoreWorldDataVersion=true`,
      `JVM_DD_OPTS=Paper.IgnoreWorldDataVersion=true,paper.ignoreWorldDataVersion=true`
    ],
    ExposedPorts: {
      [`${serverData.port}/tcp`]: {}
    },
    HostConfig: {
      PortBindings: {
        [`${serverData.port}/tcp`]: [
          {
            HostPort: `${serverData.port}`
          }
        ]
      },
      Binds: [`${serverDir}:/data`]
    }
  });

  return container.id;
};

export const startContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    
    // Load server data if not cached
    if (!mockServerData[id]) {
      try {
        const servers = await fs.readJson(path.join(process.cwd(), ".data", "servers.json"));
        mockServerData[id] = servers.find((s: any) => s.id === id) || {};
      } catch (e) {}
    }
    const server = mockServerData[id] || {};
    const serverType = server.serverType || "minecraft";

    let startupLogs: string[] = [];

    if (serverType === "discord") {
      const isPython = server.subType === "python" || server.version?.toLowerCase().includes("python");
      const runtime = isPython ? "Python 3.11.8" : "Node.js v20.12.2";
      const startupFile = server.startupFile || (isPython ? "bot.py" : "index.js");
      
      startupLogs = [
        `[System] Initializing Discord Bot runtime container...`,
        `[System] Runtime: ${runtime} | Working Directory: /app`,
        `[System] Checking environment variables in .env...`,
        `[Bot] Executing: ${isPython ? 'python' : 'node'} ${startupFile}`,
        `[Bot] Connecting to Discord Gateway (API v10)...`,
        `[Bot Ready] Logged in as ${server.name}#2026 (ID: 10928491823901920)`,
        `[Bot Ready] Serving in 1 guild | Listening for prefix: "${server.prefix || '!'}" and slash commands.`,
        `[Bot] Type "${server.prefix || '!'}ping" or "${server.prefix || '!'}help" to test bot commands.`
      ];
    } else if (serverType === "website") {
      startupLogs = [
        `[System] Initializing Web Server container on port ${server.port || 8080}...`,
        `[Web] Static HTTP engine bound to 0.0.0.0:${server.port || 8080}`,
        `[Web] Document root: /var/www/html (.data/servers/${id})`,
        `[Web] Server is live! Live preview available in the Web & Preview tab.`,
        `[Web] [${new Date().toLocaleTimeString()}] GET / - 200 OK (2.1ms)`
      ];
    } else {
      startupLogs = [
        `[System] Loading Minecraft ${server.version || "1.21.1"} PaperMC runtime...`,
        `[Paper] Starting minecraft server version ${server.version || "1.21.1"}`,
        `[Paper] Loading properties from server.properties`,
        `[Paper] Default game type: SURVIVAL`,
        `[Paper] Generating keypair`,
        `[Paper] Starting Minecraft server on *:${server.port || 25565}`,
        `[Paper] Preparing level "world"`,
        `[Paper] Preparing start region for dimension minecraft:overworld`,
        `[Paper] Time elapsed: 1420 ms`,
        `[Paper] Done (2.140s)! For help, type "help"`
      ];
    }

    if (!mockLogsStore[id]) mockLogsStore[id] = [];

    // Stream logs with slight delay
    startupLogs.forEach((line, index) => {
      setTimeout(() => {
        const fullLine = line + "\r\n";
        mockLogsStore[id].push(fullLine);
        io.to(`server_${id}`).emit("log", fullLine);
      }, index * 120);
    });

    return;
  }
  const container = docker.getContainer(containerId);
  await container.start();
};

export const stopContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = false;
    const logLine = `[System] Server stopped (Graceful shutdown).\r\n`;
    if (!mockLogsStore[id]) mockLogsStore[id] = [];
    mockLogsStore[id].push(logLine);
    io.to(`server_${id}`).emit("log", logLine);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.stop();
};

export const restartContainer = async (containerId: string) => {
  if (isSandbox) {
    await stopContainer(containerId);
    setTimeout(() => {
      startContainer(containerId);
    }, 600);
    return;
  }
  const container = docker.getContainer(containerId);
  await container.restart();
};

export const deleteContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    delete mockState[id];
    delete mockServerData[id];
    delete mockLogsStore[id];
    return;
  }
  const container = docker.getContainer(containerId);
  try {
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }
    await container.remove({ force: true });
  } catch (err) {
    console.error("Error deleting container", err);
  }
};

export const getContainerStatus = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    const isRunning = mockState[id] || false;
    return { State: { Running: isRunning, Status: isRunning ? "running" : "exited" } };
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info;
  } catch (e) {
    return null;
  }
};

export const getContainerStats = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    if (!mockState[id]) return { cpu: 0, ram: 0, disk: 0 };
    
    // Stable pseudo-random mock stats based on time so it fluctuates realistically
    const timeSec = Math.floor(Date.now() / 5000);
    const floatPseudo = (Math.sin(timeSec + id.charCodeAt(0)) + 1) / 2; // 0 to 1
    
    return {
      cpu: floatPseudo * 10 + 2, // 2% to 12%
      ram: 600 + (floatPseudo * 50 - 25), // ~600 MB
      disk: 2.1
    };
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (!info.State.Running) {
      return { cpu: 0, ram: 0, disk: 0 };
    }
    const statsResult = await container.stats({ stream: false });
    
    let cpuPercent = 0.0;
    try {
      const cpuDelta = statsResult.cpu_stats.cpu_usage.total_usage - statsResult.precpu_stats.cpu_usage.total_usage;
      const systemDelta = statsResult.cpu_stats.system_cpu_usage - statsResult.precpu_stats.system_cpu_usage;
      if (systemDelta > 0.0 && cpuDelta > 0.0) {
        const cpus = statsResult.cpu_stats.online_cpus || statsResult.cpu_stats.cpu_usage.percpu_usage?.length || 1;
        cpuPercent = (cpuDelta / systemDelta) * cpus * 100.0;
      }
    } catch(e) {}

    let ramMB = 0.0;
    try {
      const stats = statsResult.memory_stats.stats as any || {};
      const cache = stats.cache || stats.inactive_file || stats.total_inactive_file || 0;
      const usedMemory = statsResult.memory_stats.usage - cache;
      ramMB = usedMemory / 1024 / 1024;
    } catch(e) {}

    // Roughly calculate disk size from the volume directory if possible, or provide a default for now.
    return {
      cpu: cpuPercent,
      ram: ramMB,
      disk: 2.1
    };
  } catch (e) {
    return { cpu: 0, ram: 0, disk: 0 };
  }
};

export const getContainerLogs = async (containerId: string): Promise<string> => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    return (mockLogsStore[id] || []).join("") || "[System] Server initialized in sandbox mode. Click 'Start' to launch.\r\n";
  }
  try {
    const container = docker.getContainer(containerId);
    
    // Convert Buffer log output to string safely. dockerode returns interleaved multiplexed streams if tty is false,
    // but we use tty: true in createServerContainer, so it's a raw stream buffer.
    const logsBuffer = await container.logs({ stdout: true, stderr: true, tail: 100 });
    return logsBuffer.toString('utf8');
  } catch (e) {
    return "";
  }
};

const activeStreams: Record<string, NodeJS.ReadWriteStream> = {};

export const attachContainerSocket = async (containerId: string, serverId: string) => {
  if (isSandbox) {
    return;
  }
  try {
    const container = docker.getContainer(containerId);
    if (!activeStreams[containerId]) {
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      activeStreams[containerId] = stream;
      stream.on('data', (chunk) => {
        io.to(`server_${serverId}`).emit("log", chunk.toString());
      });
      stream.on('end', () => {
        delete activeStreams[containerId];
      });
    }
  } catch(e) {
    console.error("Attach error", e);
  }
};

export const sendContainerCommand = async (containerId: string, command: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    const trimmed = command.trim();
    const logLine = `> ${trimmed}\r\n`;
    if (!mockLogsStore[id]) mockLogsStore[id] = [];
    mockLogsStore[id].push(logLine);
    io.to(`server_${id}`).emit("log", logLine);

    if (!mockServerData[id]) {
      try {
        const servers = await fs.readJson(path.join(process.cwd(), ".data", "servers.json"));
        mockServerData[id] = servers.find((s: any) => s.id === id) || {};
      } catch (e) {}
    }
    const server = mockServerData[id] || {};
    const serverType = server.serverType || "minecraft";

    let reply = "";
    const lower = trimmed.toLowerCase();

    if (serverType === "discord") {
      if (lower === "!ping" || lower === "ping") {
        reply = `🏓 [Bot] Pong! Latency: ${Math.floor(Math.random() * 20 + 30)}ms | API WebSocket: ${Math.floor(Math.random() * 10 + 25)}ms\r\n`;
      } else if (lower === "!help" || lower === "help") {
        reply = `🤖 [Bot] Available commands:\r\n  • !ping   - Check bot latency\r\n  • !info   - Bot instance specifications\r\n  • !uptime  - Process uptime\r\n  • !status  - Discord gateway connection state\r\n`;
      } else if (lower === "!info" || lower === "info") {
        reply = `⚡ [Bot] ${server.name} running on JTG Panel\r\n  Runtime: ${server.subType === 'python' ? 'Python 3.11' : 'Node.js 20.12'}\r\n  Active Guilds: 1 | Cached Users: 24\r\n  RAM: 42.6 MB / ${server.ram || 1} GB\r\n`;
      } else if (lower === "!status" || lower === "status") {
        reply = `🟢 [Bot] Status: ONLINE | Gateway: Ready | Shard: [0/1]\r\n`;
      } else if (lower === "!uptime" || lower === "uptime") {
        reply = `⏱️ [Bot] Process Uptime: 14m 28s\r\n`;
      } else if (lower.startsWith("npm install") || lower.startsWith("pip install")) {
        reply = `[System] Installing dependencies from ${server.subType === 'python' ? 'requirements.txt' : 'package.json'}...\r\n[System] Up to date (0 vulnerabilities)\r\n`;
      } else if (lower === "node -v") {
        reply = `v20.12.2\r\n`;
      } else if (lower === "python --version" || lower === "python3 --version") {
        reply = `Python 3.11.8\r\n`;
      } else {
        reply = `[Bot] Command executed: "${trimmed}"\r\n`;
      }
    } else if (serverType === "website") {
      if (lower === "status") {
        reply = `[Web] HTTP Status: 200 OK | Port: ${server.port || 8080} | Engine: ${server.subType === 'node' ? 'Node.js/Express' : 'Static HTTP'}\r\n`;
      } else if (lower === "routes") {
        reply = `[Web] Active Endpoints:\r\n  GET /                -> index.html\r\n  GET /style.css       -> CSS stylesheet\r\n  GET /app.js          -> JavaScript bundle\r\n`;
      } else if (lower.startsWith("curl") || lower === "test") {
        reply = `HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: 1420\r\nConnection: keep-alive\r\n<!DOCTYPE html> <html> ... </html>\r\n`;
      } else {
        reply = `[Web] Console command acknowledged: ${trimmed}\r\n`;
      }
    } else {
      if (lower === "help") {
        reply = `Available commands: list, op <player>, deop <player>, say <msg>, tps, stop, time <set>\r\n`;
      } else if (lower === "list") {
        reply = `There are 0 of a max of 20 players online:\r\n`;
      } else if (lower === "tps") {
        reply = `TPS from last 1m, 5m, 15m: 20.00, 20.00, 20.00\r\n`;
      } else if (lower.startsWith("say ")) {
        reply = `[Server] ${trimmed.substring(4)}\r\n`;
      } else if (lower.startsWith("op ")) {
        reply = `Made ${trimmed.substring(3)} a server operator\r\n`;
      } else {
        reply = `Unknown or incomplete command, see "help"\r\n`;
      }
    }

    if (reply) {
      mockLogsStore[id].push(reply);
      io.to(`server_${id}`).emit("log", reply);
    }
    return;
  }
  if (activeStreams[containerId]) {
    activeStreams[containerId].write(command + "\n");
  } else {
    try {
      const container = docker.getContainer(containerId);
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      activeStreams[containerId] = stream;
      stream.write(command + "\n");
      stream.on('data', (chunk) => {
        // Will be broadcasted due to existing or new attach
      });
    } catch(e) {
       console.error("Command error", e);
    }
  }
};
