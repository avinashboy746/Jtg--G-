import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Server, 
  ArrowLeft, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Globe, 
  User, 
  AlertTriangle,
  Bot,
  Gamepad2,
  Terminal,
  Key,
  Hash,
  FileCode,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SearchableDropdown from "../components/SearchableDropdown";

type ServerType = "minecraft" | "discord" | "website";

export default function CreateServer() {
  const [serverType, setServerType] = useState<ServerType>("minecraft");
  const [subType, setSubType] = useState<string>("node"); // node/python for bot, static/node for website
  const [name, setName] = useState("");
  const [ram, setRam] = useState<string>("2");
  const [cpu, setCpu] = useState<string>("100");
  const [disk, setDisk] = useState<string>("10");
  const [port, setPort] = useState<string>("25565");
  const [ipAlias, setIpAlias] = useState<string>("");
  const [version, setVersion] = useState("1.21.1");
  const [owner, setOwner] = useState("");
  
  // Discord Bot specific
  const [botToken, setBotToken] = useState("");
  const [prefix, setPrefix] = useState("!");
  const [startupFile, setStartupFile] = useState("index.js");

  const [versions, setVersions] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);
  const [totalSystemRam, setTotalSystemRam] = useState<number>(0);
  const [showRamWarning, setShowRamWarning] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    axios.get("/api/system/paper-versions").then(res => {
      setVersions(res.data);
      if(res.data.length > 0) setVersion(res.data[0]);
    }).catch(() => {});
    
    axios.get("/api/system/stats").then(res => {
      setTotalSystemRam(res.data.totalMemory / (1024 * 1024 * 1024));
    }).catch(() => {});

    axios.get("/api/auth/users").then(res => {
      setUsers(res.data);
      if (res.data.length > 0) {
        const defaultOwner = res.data.find((u: any) => u.id === user?.id)?.id || res.data[0].id;
        setOwner(defaultOwner);
      }
    }).catch(() => {});
  }, [user]);

  // Handle switching server type defaults
  const handleTypeChange = (type: ServerType) => {
    setServerType(type);
    if (type === "discord") {
      setRam("1");
      setCpu("50");
      setDisk("5");
      setPort("0");
      setSubType("node");
      setStartupFile("index.js");
      setName(prev => prev || "My Discord Bot");
    } else if (type === "website") {
      setRam("1");
      setCpu("50");
      setDisk("5");
      setPort("8080");
      setSubType("static");
      setName(prev => prev || "My Website");
    } else {
      setRam("2");
      setCpu("100");
      setDisk("10");
      setPort("25565");
      setSubType("paper");
      setName(prev => prev || "Survival Server");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for RAM overcommit
    if (totalSystemRam > 0 && Number(ram) > totalSystemRam && !showRamWarning) {
      setShowRamWarning(true);
      return;
    }
    
    executeSubmit();
  };
  
  const executeSubmit = async () => {
    setShowRamWarning(false);
    setLoading(true);
    setCreateProgress(0);

    const interval = setInterval(() => {
      setCreateProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 250);
    
    try {
      let resolvedVersion = version;
      if (serverType === "discord") {
        resolvedVersion = subType === "python" ? "Python 3.11" : "Node.js 20";
      } else if (serverType === "website") {
        resolvedVersion = subType === "node" ? "Node.js Express" : "Static HTML5";
      }

      const payload: any = { 
        name, 
        serverType,
        subType,
        ram: Number(ram), 
        cpu: Number(cpu),
        disk: Number(disk),
        port: Number(port) || 0, 
        ipAlias,
        version: resolvedVersion,
        botToken,
        prefix,
        startupFile
      };
      if (owner) {
        payload.owner = owner;
      }
      await axios.post("/api/servers", payload);
      
      clearInterval(interval);
      setCreateProgress(100);
      
      setTimeout(() => {
        navigate("/servers");
      }, 500);
    } catch (e: any) {
      clearInterval(interval);
      setCreateProgress(0);
      alert(e.response?.data?.error || "Error creating server");
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-5 md:p-10 max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <Link to="/servers" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Instances
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Deploy New Instance</h1>
        <p className="text-zinc-400">Choose your application workload type and configure system parameters.</p>
      </div>

      {/* WORKLOAD TYPE SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Minecraft */}
        <button
          type="button"
          onClick={() => handleTypeChange("minecraft")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            serverType === "minecraft"
              ? "bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10"
              : "bg-[#0a0a0c] border-white/5 hover:border-white/10 opacity-75 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${serverType === "minecraft" ? "bg-indigo-500 text-white" : "bg-white/5 text-zinc-400"}`}>
              <Gamepad2 className="w-6 h-6" />
            </div>
            {serverType === "minecraft" && (
              <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Minecraft Server</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              PaperMC / Spigot engine with server.properties, RCON, and low-latency ports.
            </p>
          </div>
        </button>

        {/* Discord Bot */}
        <button
          type="button"
          onClick={() => handleTypeChange("discord")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            serverType === "discord"
              ? "bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10"
              : "bg-[#0a0a0c] border-white/5 hover:border-white/10 opacity-75 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${serverType === "discord" ? "bg-indigo-500 text-white" : "bg-white/5 text-zinc-400"}`}>
              <Bot className="w-6 h-6" />
            </div>
            {serverType === "discord" && (
              <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Discord Bot Host</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Host Node.js (discord.js) or Python (discord.py) bots with 24/7 uptime & .env config.
            </p>
          </div>
        </button>

        {/* Website Hosting */}
        <button
          type="button"
          onClick={() => handleTypeChange("website")}
          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
            serverType === "website"
              ? "bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10"
              : "bg-[#0a0a0c] border-white/5 hover:border-white/10 opacity-75 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${serverType === "website" ? "bg-indigo-500 text-white" : "bg-white/5 text-zinc-400"}`}>
              <Globe className="w-6 h-6" />
            </div>
            {serverType === "website" && (
              <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Website Hosting</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Host Static HTML/CSS/JS or Node.js Express web servers with instant live preview.
            </p>
          </div>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-[#0a0a0c] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl relative">
        <div className="space-y-6 relative z-10">
          {/* Instance Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
              <Server className="w-4 h-4 mr-2 text-indigo-400" /> Instance Name
            </label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none"
              placeholder={
                serverType === "discord"
                  ? "e.g. Moderation Bot"
                  : serverType === "website"
                  ? "e.g. Portfolio Website"
                  : "e.g. Production Survival"
              }
            />
          </div>

          {/* DISCORD BOT SPECIFIC FIELDS */}
          {serverType === "discord" && (
            <div className="bg-white/[0.01] p-5 rounded-2xl border border-white/[0.04] space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Bot size={15} /> Bot Engine Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Runtime Language</label>
                  <select
                    value={subType}
                    onChange={e => {
                      const val = e.target.value;
                      setSubType(val);
                      setStartupFile(val === "python" ? "bot.py" : "index.js");
                    }}
                    className="w-full bg-[#111114] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="node">Node.js (discord.js v14)</option>
                    <option value="python">Python 3.11 (discord.py)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Startup File</label>
                  <input
                    type="text"
                    value={startupFile}
                    onChange={e => setStartupFile(e.target.value)}
                    placeholder={subType === "python" ? "bot.py" : "index.js"}
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                    <Key size={12} className="text-indigo-400" /> Bot Token (Optional now, can set later)
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    placeholder="MTA5Mjg0OT..."
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                    <Hash size={12} className="text-indigo-400" /> Command Prefix
                  </label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={e => setPrefix(e.target.value)}
                    placeholder="!"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* WEBSITE SPECIFIC FIELDS */}
          {serverType === "website" && (
            <div className="bg-white/[0.01] p-5 rounded-2xl border border-white/[0.04] space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Globe size={15} /> Web Server Setup
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Website Engine</label>
                  <select
                    value={subType}
                    onChange={e => setSubType(e.target.value)}
                    className="w-full bg-[#111114] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="static">Static Site (HTML, CSS, JS)</option>
                    <option value="node">Node.js Express App</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">HTTP Web Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="8080"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MINECRAFT SPECIFIC VERSION SELECTOR */}
          {serverType === "minecraft" && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">PaperMC Software Version</label>
              <SearchableDropdown
                value={version}
                onChange={setVersion}
                options={versions.map(v => ({ value: v, label: v }))}
                placeholder="Select a version..."
                searchPlaceholder="Search versions..."
                className="font-mono"
              />
            </div>
          )}
          
          {/* HARDWARE RESOURCES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.01] p-5 rounded-2xl border border-white/[0.02]">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
                <MemoryStick className="w-4 h-4 mr-2 text-purple-400" /> RAM Allocation (GB)
              </label>
              <input 
                type="number" 
                required 
                min={1}
                value={ram} 
                onChange={e => setRam(e.target.value)} 
                className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
                <Cpu className="w-4 h-4 mr-2 text-blue-400" /> CPU Limit (%)
              </label>
              <input 
                type="number" 
                required 
                min={10}
                value={cpu} 
                onChange={e => setCpu(e.target.value)} 
                className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
                <HardDrive className="w-4 h-4 mr-2 text-emerald-400" /> Disk Limit (GB)
              </label>
              <input 
                type="number" 
                required 
                min={1}
                value={disk} 
                onChange={e => setDisk(e.target.value)} 
                className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none font-mono"
              />
            </div>
            {serverType === "minecraft" && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
                   <Globe className="w-4 h-4 mr-2 text-orange-400" /> Minecraft Port
                </label>
                <input 
                  type="number" 
                  required 
                  value={port} 
                  onChange={e => setPort(e.target.value)} 
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none font-mono"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
                 <Globe className="w-4 h-4 mr-2 text-indigo-400" /> Domain / Host Alias
              </label>
              <input 
                type="text" 
                value={ipAlias} 
                onChange={e => setIpAlias(e.target.value)} 
                placeholder={serverType === "website" ? "e.g. site.example.com" : "e.g. play.example.com"}
                className="w-full bg-white/[0.02] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3 text-white transition-all shadow-inner outline-none font-mono"
              />
            </div>
          </div>

          {/* Assign Owner */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-indigo-400" /> Assign Server Owner
            </label>
            <SearchableDropdown
              value={owner}
              onChange={setOwner}
              options={users.map(u => ({ value: u.id, label: `${u.username} ${u.id === user?.id ? "(You)" : `(${u.role})`}` }))}
              placeholder="Select a user..."
              searchPlaceholder="Search users..."
            />
            <p className="text-xs text-zinc-500 mt-2">Select which user owns and has access to this instance.</p>
          </div>

          <div className="pt-4 border-t border-white/5">
             {loading && (
               <div className="mb-6 p-4 border border-zinc-800 bg-black/20 rounded-xl">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-medium text-indigo-400">
                     Deploying {serverType === "discord" ? "Discord Bot" : serverType === "website" ? "Website Host" : "Minecraft Server"}...
                   </span>
                   <span className="text-sm font-mono text-indigo-400/80">{createProgress}%</span>
                 </div>
                 <div className="w-full bg-zinc-800/50 rounded-full h-2.5 overflow-hidden">
                   <div 
                     className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                     style={{ width: `${createProgress}%` }}
                   ></div>
                 </div>
               </div>
             )}
             
             <button 
                type="submit" 
                disabled={loading}
                className="w-full px-4 py-3.5 bg-white text-zinc-900 hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full mr-3" />
                    Deploying Instance...
                  </>
                ) : (
                  `Launch ${serverType === "discord" ? "Discord Bot" : serverType === "website" ? "Website Host" : "Minecraft Instance"}`
                )}
             </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showRamWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-red-500/30 shadow-2xl shadow-red-500/10 rounded-2xl p-6 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
              <div className="flex items-start mb-4">
                <div className="bg-red-500/10 p-3 rounded-full mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">High RAM Allocation</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    You are attempting to allocate <strong className="text-white">{ram}GB</strong> of RAM, but this system has <strong className="text-white">{totalSystemRam.toFixed(1)}GB</strong> physically available.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRamWarning(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSubmit}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/30"
                >
                  Yes, Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
