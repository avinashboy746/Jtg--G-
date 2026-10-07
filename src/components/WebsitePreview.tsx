import React, { useState } from "react";
import { 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Folder, 
  Code, 
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";

interface WebsitePreviewProps {
  serverId: string;
  server?: any;
}

export default function WebsitePreview({ serverId, server }: WebsitePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const previewUrl = `/api/servers/${serverId}/preview/`;
  const isOnline = server?.status === "online";
  const displayHost = server?.ipAlias 
    ? `http://${server.ipAlias}${server?.port ? `:${server.port}` : ""}`
    : `http://${window.location.hostname}:${server?.port || 8080}`;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(displayHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0c] text-white">
      {/* Top Controls Bar */}
      <div className="bg-[#0e0e11] border-b border-white/5 p-3 md:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Globe className="w-4 h-4" />
          </span>
          <div className="flex-1 flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-300">
            <span className="text-zinc-500 mr-2 select-none">URL:</span>
            <span className="truncate flex-1">{displayHost}</span>
            <button
              onClick={handleCopyUrl}
              className="ml-2 text-zinc-400 hover:text-white transition-colors"
              title="Copy public URL"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* View mode & actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("desktop")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "desktop" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Desktop View"
            >
              <Monitor size={15} />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "mobile" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Mobile View"
            >
              <Smartphone size={15} />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
            title="Reload Preview Frame"
          >
            <RefreshCw size={15} />
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Open in Tab</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Offline Banner if applicable */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>This web hosting instance is currently stopped. Click <strong>Start</strong> in the top bar to activate live serving.</span>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center bg-[#070709]">
        <div 
          className={`h-full transition-all duration-300 flex flex-col bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative ${
            viewMode === "mobile" ? "w-[390px] max-w-full" : "w-full"
          }`}
        >
          {/* Mock Browser Header */}
          <div className="h-8 bg-[#141418] border-b border-white/5 px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate px-4">
              {server?.name || "Website Preview"} &bull; {viewMode}
            </div>
            <div className="w-10"></div>
          </div>

          {/* Embedded Web Frame */}
          <iframe
            key={refreshKey}
            src={previewUrl}
            title={server?.name || "Website Preview"}
            className="flex-1 w-full h-full bg-white border-0"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>

      {/* Bottom Quick Help Bar */}
      <div className="bg-[#0e0e11] border-t border-white/5 p-3 px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Code size={14} className="text-indigo-400" />
            Mode: <strong>{server?.subType === "node" ? "Node.js Express App" : "Static HTML/CSS/JS"}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Globe size={14} className="text-indigo-400" />
            Port: <strong>{server?.port || 8080}</strong>
          </span>
        </div>
        <Link
          to={`/servers/${serverId}/files`}
          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
        >
          <Folder size={14} /> Open File Manager to edit index.html & style.css &rarr;
        </Link>
      </div>
    </div>
  );
}
