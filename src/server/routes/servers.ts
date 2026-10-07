import express from "express";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import { 
  getServers, 
  createServer, 
  getServer, 
  deleteServer, 
  startServer, 
  stopServer, 
  restartServer, 
  changeServerVersion, 
  getFiles, 
  uploadFile, 
  deleteFile, 
  renameFile, 
  saveFileContent, 
  sendCommand, 
  getServerStats, 
  updateOwner, 
  updateIpAlias, 
  getBackups, 
  createBackup, 
  downloadBackup, 
  deleteBackup, 
  unzipFile, 
  zipFiles,
  getBotConfig,
  updateBotConfig,
  installPackages,
  serveWebPreview
} from "../controllers/servers.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: path.join(process.cwd(), ".data/temp/") });

// Public web preview route (accessible inside iframes without bearer token)
router.get("/:id/preview", serveWebPreview);
router.get("/:id/preview/*", serveWebPreview);

router.use(requireAuth);

router.get("/", getServers);
router.post("/", createServer);
router.get("/:id", getServer);
router.get("/:id/stats", getServerStats);
router.delete("/:id", deleteServer);
router.put("/:id/owner", updateOwner);
router.put("/:id/ipalias", updateIpAlias);

router.put("/:id/version", changeServerVersion);

router.post("/:id/start", startServer);
router.post("/:id/stop", stopServer);
router.post("/:id/restart", restartServer);
router.post("/:id/command", sendCommand);

// Bot specific endpoints
router.get("/:id/bot-config", getBotConfig);
router.put("/:id/bot-config", updateBotConfig);
router.post("/:id/install-packages", installPackages);

// Simple file endpoints
router.get("/:id/files", getFiles);
router.post("/:id/files/upload", upload.single("file") as any, uploadFile);
router.post("/:id/files/rename", renameFile);
router.post("/:id/files/save", saveFileContent);
router.post("/:id/files/unzip", unzipFile);
router.post("/:id/files/zip", zipFiles);
router.delete("/:id/files", deleteFile);

// Backup endpoints
router.get("/:id/backups", getBackups);
router.post("/:id/backups", createBackup);
router.get("/:id/backups/:filename", downloadBackup);
router.delete("/:id/backups/:filename", deleteBackup);

export default router;
