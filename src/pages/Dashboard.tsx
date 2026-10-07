import React, { useEffect, useState } from "react";
import axios from "axios";
import { Server, Activity, HardDrive, Cpu, MemoryStick, ChevronRight, Bot, Globe, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, serversRes] = await Promise.all([
          axios.get("/api/system/stats"),
          axios.get("/api/servers")
        ]);
        setStats(statsRes.data);
        setServers(serversRes.data);
      } catch(e){}
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full"
      />
    </div>
  );

  const runningServers = servers.filter(s => s.status === 'online').length;
  const discordBots = servers.filter(s => s.serverType === 'discord').length;
  const websites = servers.filter(s => s.serverType === 'website').length;
  const minecraftServers = servers.filter(s => (s.serverType || 'minecraft') === 'minecraft').length;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-5 md:p-10 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">System Overview</h1>
          <p className="text-zinc-400">Monitor your game servers, Discord bots, and web hosts.</p>
        </div>
        {user?.role === "admin" && (
          <Link to="/servers/create" className="px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 text-sm whitespace-nowrap inline-flex items-center self-start md:self-auto">
            Deploy New Instance
          </Link>
        )}
      </div>
      
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Instances" value={servers.length.toString()} icon={<Server size={22} className="text-indigo-400" />} trend="All services" chartColor="from-indigo-500 to-indigo-500/0" />
        <StatCard title="Online Instances" value={runningServers.toString()} icon={<Activity size={22} className="text-emerald-400" />} trend="Active now" chartColor="from-emerald-500 to-emerald-500/0" />
        <StatCard title="Discord Bots" value={discordBots.toString()} icon={<Bot size={22} className="text-purple-400" />} trend="24/7 Bot Hosts" chartColor="from-purple-500 to-purple-500/0" />
        <StatCard title="Websites" value={websites.toString()} icon={<Globe size={22} className="text-blue-400" />} trend="Live Web Hosts" chartColor="from-blue-500 to-blue-500/0" />
      </motion.div>

      {user?.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/5 text-blue-400">
                <Cpu size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold">Host CPU Usage</p>
                <p className="text-xl font-bold text-white font-mono">{stats.cpuUsage}%</p>
              </div>
            </div>
            <div className="w-32 bg-zinc-800/50 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(stats.cpuUsage, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-[#0a0a0c] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/5 text-purple-400">
                <MemoryStick size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold">Host RAM Usage</p>
                <p className="text-xl font-bold text-white font-mono">{stats.ramUsage}%</p>
              </div>
            </div>
            <div className="w-32 bg-zinc-800/50 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(stats.ramUsage, 100)}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white">Recent Activity</h2>
        <Link to="/servers" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center transition-colors">
          View all <ChevronRight size={16} className="ml-1" />
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="bg-[#0a0a0c] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {servers.length === 0 ? (
           <div className="p-12 text-center">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <Server className="text-zinc-500" size={32} />
             </div>
             <h3 className="text-lg font-medium text-white mb-1">No Activity Found</h3>
             <p className="text-zinc-500 text-sm">Create a new Minecraft server, Discord bot, or website to get started.</p>
           </div>
        ) : (
          <div className="divide-y divide-white/5">
            {servers.slice(0, 6).map((server, index) => {
              const type = server.serverType || "minecraft";
              return (
                <motion.div 
                  key={server.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (index * 0.05) }}
                >
                  <Link to={`/servers/${server.id}`} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all">
                        {type === "discord" ? (
                          <Bot className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                        ) : type === "website" ? (
                          <Globe className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                        ) : (
                          <Gamepad2 className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{server.name}</h3>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-white/5">
                            {type === "discord" ? "Discord" : type === "website" ? "Website" : "Minecraft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex h-2 w-2 relative">
                            {server.status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${server.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'}`}></span>
                          </span>
                          <p className="text-xs text-zinc-500 capitalize">{server.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-mono text-zinc-500 hidden sm:block">
                        {new Date(server.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors group-hover:translate-x-1" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, trend, chartColor }: { title: string, value: string, icon: React.ReactNode, trend?: string, chartColor?: string }) {
  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
  return (
    <motion.div variants={itemAnim} className="bg-[#0a0a0c] p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${chartColor} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/5">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-zinc-400">{title}</p>
      </div>
      {trend && (
        <div className="relative z-10 mt-4 text-xs font-medium text-zinc-500">
          {trend}
        </div>
      )}
    </motion.div>
  );
}
