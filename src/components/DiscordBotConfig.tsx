import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Bot, 
  Key, 
  Save, 
  ExternalLink, 
  Terminal, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Package, 
  Hash, 
  FileCode, 
  HelpCircle, 
  RefreshCw,
  Sparkles
} from "lucide-react";

interface BotConfigProps {
  serverId: string;
  server?: any;
}

export default function DiscordBotConfig({ serverId, server }: BotConfigProps) {
  const [token, setToken] = useState("");
  const [prefix, setPrefix] = useState("!");
  const [clientID, setClientID] = useState("");
  const [subType, setSubType] = useState("node");
  const [startupFile, setStartupFile] = useState("index.js");
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [serverId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/servers/${serverId}/bot-config`);
      setToken(res.data.token || "");
      setPrefix(res.data.prefix || "!");
      setClientID(res.data.clientID || "");
      setSubType(res.data.subType || "node");
      setStartupFile(res.data.startupFile || (res.data.subType === "python" ? "bot.py" : "index.js"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await axios.put(`/api/servers/${serverId}/bot-config`, {
        token,
        prefix,
        clientID,
        subType,
        startupFile
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save bot settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstallPackages = async () => {
    try {
      setIsInstalling(true);
      await axios.post(`/api/servers/${serverId}/install-packages`);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3500);
    } catch (e) {
      alert("Failed to trigger package install");
    } finally {
      setIsInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isPython = subType === "python";

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Bot className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">Discord Bot Configuration</h2>
            </div>
            <p className="text-xs md:text-sm text-zinc-400">
              Manage your bot authentication token, commands prefix, and runtime parameters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallPackages}
              disabled={isInstalling}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-semibold rounded-xl transition-all flex items-center disabled:opacity-50"
              title="Run npm install or pip install"
            >
              <Package className="w-4 h-4 mr-1.5 text-indigo-400" />
              {isInstalling ? "Installing..." : installSuccess ? "Packages Installed!" : "Install Packages"}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Bot credentials and configuration updated! Restart the bot to apply changes.
          </div>
        )}

        {/* Bot Config Form */}
        <form onSubmit={handleSave} className="bg-[#0e0e11] border border-white/5 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bot Token */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" /> Discord Bot Token
                </span>
                <span className="text-[11px] text-zinc-500 normal-case font-normal">
                  Saved to server's .env file
                </span>
              </label>
              <div className="relative">
                <input 
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste your bot token here (MTA5Mjg0OT...)"
                  className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none pr-12 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Never share your bot token with anyone. Reset it immediately if compromised.
              </p>
            </div>

            {/* Prefix */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" /> Command Prefix
              </label>
              <input 
                type="text" 
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                placeholder="e.g. ! or ? or /"
                className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">Default prefix for chat commands (e.g. {prefix}ping, {prefix}help)</p>
            </div>

            {/* Client ID / App ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Client / Application ID (Optional)
              </label>
              <input 
                type="text" 
                value={clientID}
                onChange={e => setClientID(e.target.value)}
                placeholder="e.g. 10928491823901920"
                className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">Used for Discord slash command registration</p>
            </div>

            {/* Runtime Language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Runtime Engine
              </label>
              <select
                value={subType}
                onChange={e => {
                  const val = e.target.value;
                  setSubType(val);
                  setStartupFile(val === "python" ? "bot.py" : "index.js");
                }}
                className="w-full bg-[#141418] border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="node">Node.js (discord.js v14)</option>
                <option value="python">Python 3.11 (discord.py)</option>
              </select>
            </div>

            {/* Startup File */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Entrypoint File
              </label>
              <input 
                type="text" 
                value={startupFile}
                onChange={e => setStartupFile(e.target.value)}
                placeholder={isPython ? "bot.py" : "index.js"}
                className="w-full bg-white/[0.03] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none transition-colors"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">Main file launched when starting container</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? "Saving..." : "Save Bot Settings"}
            </button>
          </div>
        </form>

        {/* Discord Setup Guide Card */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>How to setup & invite your Discord Bot</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
              <span className="inline-block px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono font-bold text-[10px]">
                STEP 1
              </span>
              <h4 className="font-semibold text-white">Create Discord App</h4>
              <p className="text-zinc-400 leading-relaxed">
                Visit the Discord Developer Portal, click <strong>New Application</strong>, and give your bot a name.
              </p>
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-indigo-400 hover:underline pt-1"
              >
                Open Dev Portal <ExternalLink size={12} className="ml-1" />
              </a>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
              <span className="inline-block px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono font-bold text-[10px]">
                STEP 2
              </span>
              <h4 className="font-semibold text-white">Copy Token & Intents</h4>
              <p className="text-zinc-400 leading-relaxed">
                In the <strong>Bot</strong> tab, click <strong>Reset Token</strong>. Under Privileged Gateway Intents, turn ON <strong>Message Content Intent</strong>.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
              <span className="inline-block px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono font-bold text-[10px]">
                STEP 3
              </span>
              <h4 className="font-semibold text-white">Invite & Start</h4>
              <p className="text-zinc-400 leading-relaxed">
                Go to <strong>OAuth2 URL Generator</strong>, check <code>bot</code>, copy the invite link, paste it in browser, and click <strong>Start</strong> in JTG!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
